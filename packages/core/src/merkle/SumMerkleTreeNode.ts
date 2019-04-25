import { constants, utils } from 'ethers'
import BigNumber = utils.BigNumber
import { bignumTo8BytesBuffer, bignumTo32BytesBuffer } from './utils'

export class SumMerkleTreeNode {
  public static getEmpty() {
    return new SumMerkleTreeNode(
      utils.keccak256(constants.HashZero),
      new BigNumber(0)
    )
  }

  public hash: Buffer
  public len: BigNumber

  constructor(hash: Buffer | string, len: BigNumber) {
    if (typeof hash === 'string' && utils.isHexString(hash)) {
      this.hash = Buffer.from(utils.arrayify(hash))
    } else if (hash instanceof Buffer) {
      this.hash = hash
    } else {
      throw new Error('invalid hash type')
    }
    this.len = len
  }

  public getHash(): Buffer {
    return this.hash
  }

  public getLength8Byte(): Buffer {
    return bignumTo8BytesBuffer(this.len)
  }
  public getLength32Byte(): Buffer {
    return bignumTo32BytesBuffer(this.len)
  }

  public getLengthAsBigNumber(): BigNumber {
    return this.len
  }

  public toBytes(leftOrRight: number): Buffer {
    return Buffer.concat([
      Buffer.from([leftOrRight]),
      this.getLength8Byte(),
      this.getHash()
    ])
  }
}
