const Logger = require('js-logger')
const { Chain } = require("@layer2/childchain");
const ChainDb = require('./db/LeveldbAdaptor');
const { EventWatcher, ETHEventAdaptor } = require('@layer2/events-watcher')
const ethers = require('ethers')
const rootChainInterface = new ethers.utils.Interface(require('./assets/RootChain.json').abi)

class WalletEventWatcherStorage {

  constructor(storage) {
    this.storage = storage
    this.seen = {}
  }

  async getLoaded(initialBlock) {
    try {
      const loaded = await this.storage.get('loaded')
      if(loaded) {
        return parseInt(loaded)
      } else {
        return initialBlock
      }
    } catch(e) {
      return initialBlock
    }
  }

  async setLoaded(loaded) {
    await this.storage.insert('loaded', loaded.toString())
  }

  addSeen(event) {
    this.seen[event] = true
  }

  getSeen(event) {
    return this.seen[event]
  }

}

const abi = [
  'event BlockSubmitted(bytes32 _root, uint256 _timestamp, uint256 _blkNum)',
  'event Deposited(address indexed _depositer, uint256 _start, uint256 _end, uint256 _blkNum)',
  'event ExitStarted(address indexed _exitor, bytes32 _txHash, uint256 exitableAt, uint256 _start, uint256 _end)',
  'function submit(bytes32 _root)',
  'function deposit() payable',
  'function exit(uint256 _utxoPos, uint256 _start, uint256 _end, bytes _txBytes, bytes _proof, bytes _sig) payable'
]

class ChainManager {

  constructor(privateKey, endpoint, contractAddress) {
    this.privateKey = privateKey;
    this.httpProvider = new ethers.providers.JsonRpcProvider(endpoint)
    this.contractAddress = contractAddress
    const contract = new ethers.Contract(this.contractAddress, abi, this.httpProvider)
    this.wallet = new ethers.Wallet(this.privateKey, this.httpProvider)
    this.rootChain = contract.connect(this.wallet)
    this.chain = null;
    this.timer = null;
  }

  async getSeenEvents() {
    try {
      const seenEvents = await this.chainDb.get('seenEvents');
      return seenEvents
    }catch(e) {
      return {}
    }
  }

  getChain() {
    return this.chain
  }

  async start (options) {
    const confirmation = Number(options.confirmation || 0)
    const initialBlock = Number(options.initialBlock || 1)
    const blockTime = options.blockTime || 30000;
    const metaDb = new ChainDb(options.metadb)
    const chainDb = new ChainDb(options.blockdb)
    this.chain = new Chain(chainDb, options);
    try {
      await this.chain.readSnapshot()
    } catch(e) {
      Logger.error('snapshot root not found', e)
    }

    const rootChainEventListener = new EventWatcher(
      new ETHEventAdaptor(this.contractAddress, this.httpProvider, rootChainInterface),
      new WalletEventWatcherStorage(metaDb),
      {
        initialBlock: initialBlock,
        interval: 15000,
        confirmation: confirmation        
      }
    )

    const generateBlock = async () => {
      try {
        if(this.chain.txQueue.length > 0) {
          const generateBlockResult = await this.chain.generateBlock();
          if(generateBlockResult.isOk()) {
            const result = await this.rootChain.submit(
              generateBlockResult.ok(),
              {
                gasLimit: 200000
              });
            Logger.debug(
              'SubmitBlock',
              new Date().toISOString(),
              generateBlockResult.ok(),
              result.hash)
          }else{
            Logger.error(generateBlockResult.error())
          }
          this.chain.clear()
        }
      } catch(e) {
        Logger.error(e)
        this.chain.clear()
      }
      this.timer = setTimeout(generateBlock, blockTime);
    }
    if(blockTime > 0) {
      this.timer = setTimeout(generateBlock, blockTime);
    }
    
    Logger.debug('Current State: ', this.chain.getCurrentSegments())

    rootChainEventListener.addEvent('BlockSubmitted', async (e) => {
      Logger.info(
        'eventListener.BlockSubmitted',
        e.values._blkNum.toNumber(),
        e.values._superRoot);
      await this.chain.handleSubmit(
        e.values._superRoot,
        e.values._root,
        e.values._blkNum,
        e.values._timestamp);
      Logger.debug('Current State: ', this.chain.getCurrentSegments())
    })
    rootChainEventListener.addEvent('ListingEvent', async (e) => {
      Logger.debug(
        'eventListener.ListingEvent',
        e.values._tokenId.toNumber(),
        e.values._tokenAddress);
      if(e.values._tokenId.toNumber() > 0) {
        await this.chain.handleListingEvent(
          e.values._tokenId,
          e.values._tokenAddress);
      }
    })
    rootChainEventListener.addEvent('Deposited', async (e) => {
      Logger.info(
        'eventListener.Deposited',
        e.values._blkNum.toNumber(),
        e.values._depositer);
      try {
        await this.chain.handleDeposit(
          e.values._depositer,
          e.values._tokenId,
          e.values._start,
          e.values._end,
          e.values._blkNum);
        }catch(e) {
          Logger.error(e)
      }
    })
    rootChainEventListener.addEvent('ExitStarted', async (e) => {
      Logger.debug('eventListener.ExitStarted');
      await this.chain.handleExit(
        e.values._Exitor,
        e.values._segment,
        e.values._blkNum);

    })
    await rootChainEventListener.initPolling(()=>{
      Logger.info('polling completed')
    }, (e) => {
      console.info("############################################################")
      console.info("#! ROOTCHAIN_ENDPOINT or ROOTCHAIN_ADDRESS isn't correct? !#")
      console.info("############################################################")
    })
    return this.chain;
  }
  
  async stop(){
    if(this.timer) {
      clearTimeout(this.timer);
    }
  }

}

module.exports = ChainManager
