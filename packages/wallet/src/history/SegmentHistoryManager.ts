import {
  PredicatesManager,
  Segment,
  SegmentedBlock,
  StateManager,
  StateUpdate
} from '@layer2/core'
import { WaitingBlockWrapper } from '../models'
import { IStorage } from '../storage'
import { PlasmaClient } from '../client'
import { PlasmaBlockHeader } from './PlasmaBlockHeader'
import { SegmentHistory } from './SegmentHistory'

/**
 * The manager for multiple segments history
 */
export class SegmentHistoryManager {
  public segmentHistoryMap: { [key: string]: SegmentHistory } = {}
  public blockHeaders: WaitingBlockWrapper[]
  public storage: IStorage
  public client: PlasmaClient
  public predicatesManager: PredicatesManager

  constructor(
    storage: IStorage,
    client: PlasmaClient,
    predicatesManager: PredicatesManager
  ) {
    this.storage = storage
    this.client = client
    this.blockHeaders = []
    this.predicatesManager = predicatesManager
  }

  public init(key: string, originalSegment: Segment) {
    this.segmentHistoryMap[key] = new SegmentHistory(
      this.storage,
      key,
      originalSegment
    )
  }

  public appendDeposit(deposit: StateUpdate) {
    this.storage.addBlockHeader(
      deposit.getBlkNum().toNumber(),
      JSON.stringify(
        PlasmaBlockHeader.CreateDeposit(
          deposit.getBlkNum().toNumber(),
          deposit
        ).serialize()
      )
    )
  }

  public async appendSegmentedBlock(
    key: string,
    segmentedBlock: SegmentedBlock
  ) {
    if (!this.segmentHistoryMap[key]) {
      this.init(key, segmentedBlock.getOriginalSegment())
    }
    await this.segmentHistoryMap[key].append(segmentedBlock)
  }

  public async appendBlockHeader(header: WaitingBlockWrapper) {
    this.blockHeaders.push(header)
    await this.storage.addBlockHeader(
      header.blkNum.toNumber(),
      JSON.stringify(PlasmaBlockHeader.CreateTxBlock(header).serialize())
    )
  }

  public async loadBlockHeaders(fromBlkNum: number, toBlkNum: number) {
    const serialized = await this.storage.searchBlockHeader(
      fromBlkNum,
      toBlkNum
    )
    return serialized.map((s: any) =>
      PlasmaBlockHeader.deserialize(s.blkNum, JSON.parse(s.value))
    )
  }

  public async verifyHistory(key: string) {
    const segmentChecker = new StateManager(this.predicatesManager)
    return this.loadAndVerify(segmentChecker, key, 0)
  }

  private async loadAndVerify(
    segmentChecker: StateManager,
    key: string,
    fromBlkNum: number
  ): Promise<StateUpdate[]> {
    // check segment history by this.blockHeaders
    const blockHeaders = await this.loadBlockHeaders(
      fromBlkNum,
      fromBlkNum + 100
    )
    if (blockHeaders.length > 0) {
      await this.verifyPart(segmentChecker, key, blockHeaders)
      return this.loadAndVerify(segmentChecker, key, fromBlkNum + 100)
    } else {
      return segmentChecker.getStateUpdates()
    }
  }

  private async verifyPart(
    segmentChecker: StateManager,
    key: string,
    blockHeaders: PlasmaBlockHeader[]
  ): Promise<StateUpdate[]> {
    const blockHeader = blockHeaders.shift()
    if (blockHeader) {
      if (blockHeader.isDeposit()) {
        await this.verifyDeposit(
          segmentChecker,
          blockHeader.getBlkNum(),
          blockHeader.getDeposit()
        )
      } else {
        await this.verifyBlock(segmentChecker, key, blockHeader.getBlock(), 2)
      }
      return this.verifyPart(segmentChecker, key, blockHeaders)
    } else {
      return segmentChecker.getStateUpdates()
    }
  }

  private async verifyDeposit(
    segmentChecker: StateManager,
    blkNum: number,
    deposit: StateUpdate
  ) {
    segmentChecker.insertDepositTx(deposit)
  }

  private async verifyBlock(
    segmentChecker: StateManager,
    key: string,
    blockHeader: WaitingBlockWrapper,
    retryCounter: number
  ) {
    const blkNum = blockHeader.blkNum.toNumber()
    try {
      await this.segmentHistoryMap[key].verify(
        segmentChecker,
        blkNum,
        blockHeader.root
      )
    } catch (e) {
      if (e.message === 'invalid history') {
        throw e
      }
      console.warn(e)
      const result = await this.client.getBlock(blkNum)
      if (result.isOk() && retryCounter >= 0) {
        const segmentedBlock = result
          .ok()
          .getSegmentedBlock(this.segmentHistoryMap[key].originalSegment)
        this.appendSegmentedBlock(key, segmentedBlock)
        // retry
        await this.verifyBlock(
          segmentChecker,
          key,
          blockHeader,
          retryCounter - 1
        )
      }
    }
  }
}
