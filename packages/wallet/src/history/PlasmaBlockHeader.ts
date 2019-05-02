import { StateUpdate } from '@layer2/core'
import { WaitingBlockWrapper } from '../models'

export class PlasmaBlockHeader {
  public static deserialize(blkNum: number, data: any[]) {
    const plasmaBlockHeader = new PlasmaBlockHeader(blkNum)
    if (data[0] === 'B') {
      plasmaBlockHeader.setBlock(WaitingBlockWrapper.deserialize(data[1]))
    } else if (data[0] === 'D') {
      plasmaBlockHeader.setDeposit(StateUpdate.deserialize(data[1]))
    } else {
      throw new Error('unknown type')
    }
    return plasmaBlockHeader
  }

  public static CreateDeposit(blkNum: number, deposit: StateUpdate) {
    const plasmaBlockHeader = new PlasmaBlockHeader(blkNum)
    plasmaBlockHeader.setDeposit(deposit)
    return plasmaBlockHeader
  }

  public static CreateTxBlock(block: WaitingBlockWrapper) {
    const plasmaBlockHeader = new PlasmaBlockHeader(block.blkNum.toNumber())
    plasmaBlockHeader.setBlock(block)
    return plasmaBlockHeader
  }
  public deposit?: StateUpdate
  public block?: WaitingBlockWrapper
  public blkNum: number

  constructor(blkNum: number) {
    this.blkNum = blkNum
  }

  public getBlkNum() {
    return this.blkNum
  }

  public isDeposit(): boolean {
    return !!this.deposit
  }

  public setDeposit(deposit: StateUpdate) {
    this.deposit = deposit
  }

  public setBlock(block: WaitingBlockWrapper) {
    this.block = block
  }

  public getDeposit(): StateUpdate {
    if (this.deposit) {
      return this.deposit
    } else {
      throw new Error('deposit not found')
    }
  }

  public getBlock(): WaitingBlockWrapper {
    if (this.block) {
      return this.block
    } else {
      throw new Error('block not found')
    }
  }

  public serialize() {
    if (this.block) {
      return ['B', this.block.serialize()]
    } else if (this.deposit) {
      return ['D', this.deposit.serialize()]
    } else {
      throw new Error('unknown type')
    }
  }
}
