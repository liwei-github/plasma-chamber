// const { injectInTruffle } = require('sol-trace');
// injectInTruffle(web3, artifacts);
const {
  duration,
  increaseTime,
} = require('./helpers/increaseTime')
const {
  assertRevert
} = require('./helpers/assertRevert')

const RootChain = artifacts.require("RootChain")
const Checkpoint = artifacts.require("Checkpoint")
const CustomVerifier = artifacts.require("CustomVerifier")
const VerifierUtil = artifacts.require("VerifierUtil")
const OwnershipPredicateContract = artifacts.require("OwnershipPredicate")
const PaymentChannelPredicate = artifacts.require("SwapChannelPredicate")
const Serializer = artifacts.require("Serializer")
const ERC721 = artifacts.require("ERC721")
const ethers = require('ethers')
const fs = require('fs')
const path = require('path')
const BigNumber = ethers.utils.BigNumber

const { constants } = require('@layer2/core')
const {
  ChamberWallet,
  JsonRpcClient,
  PlasmaClient,
  WalletMQTTClient,
  MockStorage
} = require('@layer2/wallet')

const { Scenario1 } = require('./testdata')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const BOND = constants.EXIT_BOND


const childChainEndpoint = 'http://localhost:3000'
const jsonRpcClient = new JsonRpcClient(childChainEndpoint)
const client = new PlasmaClient(jsonRpcClient, new WalletMQTTClient(process.env.CHILDCHAIN_PUBSUB_ENDPOINT || childChainEndpoint))
const privateKey = '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'
const address = ethers.utils.computeAddress(privateKey)
const options = {
  // kovan
  // initialBlock: 10000000,
  initialBlock: process.env.INITIAL_BLOCK || 1,
  interval: 10000,
  confirmation: process.env.CONFIRMATION || 0
}
const basePath = path.join(__dirname, './.clidb')
const persnalPath = path.join(basePath, address)
if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath);
}
if (!fs.existsSync(persnalPath)) {
  fs.mkdirSync(persnalPath);
}

contract("wallet", ([alice, bob, operator]) => {

  beforeEach(async () => {
    this.erc721 = await ERC721.new()
    this.checkpoint = await Checkpoint.new({ from: operator })
    this.verifierUtil = await VerifierUtil.new({ from: operator })
    this.ownershipPredicate = await OwnershipPredicateContract.new(
      this.verifierUtil.address, { from: operator })
    this.serializer = await Serializer.new({ from: operator })
    this.customVerifier = await CustomVerifier.new(
      this.verifierUtil.address,
      this.ownershipPredicate.address,
      {
        from: operator
      })
    this.rootChain = await RootChain.new(
      this.verifierUtil.address,
      this.serializer.address,
      this.customVerifier.address,
      this.erc721.address,
      this.checkpoint.address,
      {
        from: operator
      })
    await this.customVerifier.registerPredicate(this.ownershipPredicate.address, {from: operator})
    await this.rootChain.setup()
    this.paymentChannelPredicate = await PaymentChannelPredicate.new(
      this.verifierUtil.address,
      this.rootChain.address,
      { from: operator })
    await this.customVerifier.registerPredicate(this.paymentChannelPredicate.address, {from: operator})
    const exitNFTAddress = await this.rootChain.getTokenAddress.call()
    const exitNFT = await ERC721.at(exitNFTAddress)
    const minter = await exitNFT.getMinter.call()
    assert.equal(minter, this.rootChain.address)
    this.wallet = ChamberWallet.createWalletWithPrivateKey(
      client,
      'http://127.0.0.1:7545',
      this.rootChain.address,
      new MockStorage(),
      privateKey,
      options
    )
  });

  describe("exit", () => {

    const exitableEnd = ethers.utils.bigNumberify('3000000')

    beforeEach(async () => {
      await this.wallet.deposit('1.0')
      /*
      const result = await this.rootChain.deposit(
        {
          from: alice,
          value: '1000000000000000'
        });
      await this.rootChain.deposit(
        {
          from: bob,
          value: '1000000000000000'
        });
        */
      const submit = async (block) => {
        const result = await this.rootChain.submit(
          block.getRoot(),
          {
            from: operator
          });
        block.setBlockTimestamp(ethers.utils.bigNumberify(result.logs[0].args._timestamp.toString()))
        block.setSuperRoot(result.logs[0].args._superRoot)
      }
      await submit(Scenario1.blocks[0].block)
      await submit(Scenario1.blocks[1].block)
      await submit(Scenario1.blocks[2].block)
      await submit(Scenario1.blocks[3].block)
      await submit(Scenario1.blocks[4].block)
      /*
      await this.rootChain.deposit(
        {
          from: bob,
          value: '1000000000000000'
        })      
        */
    })

    it("should succeed to exit and finalizeExit", async () => {
      const utxos = await this.wallet.getUTXOArray()
      const resultExit = await this.wallet.exit(utxos[0])
      console.log('exit: ', resultExit)
      await increaseTime(duration.weeks(6));
      const resultFinalizeExit = await this.wallet.finalizeExit('1')
      console.log('finalizeExit: ', resultFinalizeExit)
    })

  });

})
