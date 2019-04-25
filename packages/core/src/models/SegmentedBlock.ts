import { Segment } from '../segment'
import { SignedTransactionWithProof } from '../SignedTransactionWithProof'
import { ExclusionProof } from './ExclusionProof'

type SegmentedBlockItem = SignedTransactionWithProof | ExclusionProof

export class SegmentedBlock {
  public static deserialize(data: any[]) {
    return new SegmentedBlock(
      Segment.deserialize(data[0]),
      data[1].map((item: any) => {
        if (item.type === 'E') {
          return ExclusionProof.deserialize(item)
        } else {
          return SignedTransactionWithProof.deserialize(item)
        }
      }),
      data[2]
    )
  }
  public originalSegment: Segment
  public items: SegmentedBlockItem[]
  public blkNum: number

  constructor(
    originalSegment: Segment,
    items: SegmentedBlockItem[],
    blkNum: number
  ) {
    this.originalSegment = originalSegment
    this.items = items
    this.blkNum = blkNum
  }

  public getOriginalSegment() {
    return this.originalSegment
  }

  public getItems() {
    return this.items
  }

  public getBlockNumber() {
    return this.blkNum
  }

  public serialize() {
    return [
      this.originalSegment.serialize(),
      this.items.map(item => item.serialize()),
      this.blkNum
    ]
  }
}
