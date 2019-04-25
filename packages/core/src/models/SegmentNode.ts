import { Segment } from '../segment'

export class SegmentNode {
  public segment: Segment
  public tx: string

  constructor(segment: Segment, tx: string) {
    this.segment = segment
    this.tx = tx
  }
}
