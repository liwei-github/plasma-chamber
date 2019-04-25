import * as ethers from 'ethers'

export interface IETHEventAdaptor {
  parseLog(e: ethers.providers.Log): ethers.utils.LogDescription
  getLatestBlockNumber(): Promise<number>
  getLogs(
    fromBlockNumber: number,
    blockNumber: number,
    confirmation: number
  ): Promise<ethers.providers.Log[]>
}
