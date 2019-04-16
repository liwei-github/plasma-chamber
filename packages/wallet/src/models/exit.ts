import { bigNumberify, BigNumber } from 'ethers/utils';
import { Segment } from '@layer2/core'

export class Exit {
  id: BigNumber
  exitableAt: BigNumber
  segment: Segment
  stateBytes: string

  constructor(
    id: BigNumber,
    exitableAt: BigNumber,
    segment: Segment,
    stateBytes: string
  ) {
    this.id = id
    this.exitableAt = exitableAt
    this.segment = segment
    this.stateBytes = stateBytes
  }

  getId(): string {
    return this.id.toString()
  }

  /**
   * @return return exitable time as unixtime(second)
   */
  getExitableAt(): number {
    return this.exitableAt.toNumber() * 1000
  }

  getStateBytes(): string {
    return this.stateBytes
  }

  getAmount(): number {
    return this.segment.getAmount().toNumber()
  }

  serialize() {
    return JSON.stringify({
      id: this.id.toString(),
      exitableAt: this.exitableAt.toString(),
      segment: this.segment.serialize(),
      stateBytes: this.stateBytes
    })
  }

  static deserialize(str: string) {
    const data = JSON.parse(str)
    return new Exit(
      bigNumberify(data.id),
      bigNumberify(data.exitableAt),
      Segment.deserialize(data.segment),
      data.stateBytes
    )
  }

}
