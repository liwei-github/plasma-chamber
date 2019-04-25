import { utils } from 'ethers'
import { Segment } from '../segment'

export class SumMerkleProof {
  public static deserialize(data: any): SumMerkleProof {
    return new SumMerkleProof(
      data.numTokens,
      data.index,
      Segment.deserialize(data.segment),
      data.leaf,
      data.proof
    )
  }
  public numTokens: number
  public index: number
  public segment: Segment
  public leaf: string
  public proof: string

  constructor(
    numTokens: number,
    index: number,
    segment: Segment,
    leaf: string,
    proof: string
  ) {
    this.numTokens = numTokens
    this.index = index
    this.segment = segment
    this.leaf = leaf
    this.proof = proof
  }

  public toHex() {
    const numTokens = utils.padZeros(
      utils.arrayify(utils.bigNumberify(this.numTokens)),
      2
    )
    const body = utils.arrayify(this.proof)
    return utils.hexlify(utils.concat([numTokens, body]))
  }

  public serialize() {
    return {
      numTokens: this.numTokens,
      index: this.index,
      segment: this.segment.serialize(),
      leaf: this.leaf,
      proof: this.proof
    }
  }
}
