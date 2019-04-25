import {
  Segment,
  StateManager,
  SegmentedBlock,
  SignedTransactionWithProof,
  ExclusionProof
} from '@layer2/core'
import { IStorage } from '../storage'

/**
 * The history of a segment
 */
export class SegmentHistory {
  public key: string
  public originalSegment: Segment
  public storage: IStorage

  constructor(storage: IStorage, key: string, originalSegment: Segment) {
    this.key = key
    this.storage = storage
    this.originalSegment = originalSegment
  }

  public getKey() {
    return this.key
  }

  public async append(segmentedBlock: SegmentedBlock) {
    await this.storage.addProof(
      this.getKey(),
      segmentedBlock.getBlockNumber(),
      JSON.stringify(segmentedBlock.serialize())
    )
  }

  public async getSegmentedBlock(blkNum: number) {
    const serialized = await this.storage.getProof(this.getKey(), blkNum)
    return SegmentedBlock.deserialize(JSON.parse(serialized))
  }

  public async verify(
    segmentChecker: StateManager,
    blkNum: number,
    root: string
  ) {
    // check this.history[blkNum] is exclusion proof or parent of childTxs
    const segmentedBlock = await this.getSegmentedBlock(blkNum)
    const items = segmentedBlock.getItems()
    items.forEach(item => {
      if (item instanceof SignedTransactionWithProof) {
        const tx = item as SignedTransactionWithProof
        // check inclusion check
        if (!(tx.getRoot() === root && tx.checkInclusion())) {
          throw new Error('invalid history: fail to check inclusion')
        }
        if (segmentChecker.isContain(tx.getSignedTx())) {
          segmentChecker.spend(tx.getSignedTx())
          segmentChecker.insert(tx.getSignedTx())
          // tx.getSignedTx().getStateUpdates().filter(s => s.getBlkNum().eq(blkNum))
        } else {
          throw new Error('invalid history')
        }
      } else if (item instanceof ExclusionProof) {
        const exclusionProof = item as ExclusionProof
        // check exclusion
        if (
          !(
            exclusionProof.getRoot() === root && exclusionProof.checkExclusion()
          )
        ) {
          throw new Error('invalid history: fail to check exclusion')
        }
      } else {
        throw new Error('invalid type')
      }
    })
    return true
  }
}
