import * as ethers from 'ethers'
import JsonRpcProvider = ethers.providers.JsonRpcProvider
import { IETHEventAdaptor } from './IETHEventAdaptor'

export class ETHEventAdaptor implements IETHEventAdaptor {
  public address: string
  public provider: JsonRpcProvider
  public rootChainInterface: ethers.utils.Interface

  constructor(
    address: string,
    provider: JsonRpcProvider,
    rootChainInterface: ethers.utils.Interface
  ) {
    this.provider = provider
    this.rootChainInterface = rootChainInterface
    this.address = address
  }

  public parseLog(e: ethers.providers.Log): ethers.utils.LogDescription {
    return this.rootChainInterface.parseLog(e)
  }

  public async getLatestBlockNumber() {
    const block = await this.provider.getBlock('latest')
    return block.number
  }

  public async getLogs(
    fromBlockNumber: number,
    blockNumber: number,
    confirmation: number
  ) {
    const events = await this.provider.getLogs({
      address: this.address,
      fromBlock: fromBlockNumber - confirmation * 2,
      toBlock: blockNumber - confirmation
    })
    return events
  }
}
