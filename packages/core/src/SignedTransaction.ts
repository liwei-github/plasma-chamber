import { utils } from 'ethers'
import { Signature, Address } from './helpers/types'
import { HexUtil } from './utils/hex'
import { Segment } from './segment'
import { StateUpdate } from './StateUpdate'

/**
 * SignedTransaction is the transaction and its signatures
 */
export class SignedTransaction {
  public static deserialize(data: any): SignedTransaction {
    return new SignedTransaction(
      data.states.map((state: any) => StateUpdate.deserialize(state))
    ).withRawSignatures(data.tw)
  }
  public stateUpdates: StateUpdate[]
  public transactionWitness: Signature[]

  constructor(stateUpdates: StateUpdate[]) {
    this.stateUpdates = stateUpdates
    this.transactionWitness = []
  }

  public withRawSignatures(sigs: Signature[]): SignedTransaction {
    this.transactionWitness = sigs
    return this
  }

  public getStateUpdate(stateIndex: number) {
    return this.stateUpdates[stateIndex]
  }

  public getStateUpdates() {
    return this.stateUpdates
  }

  /**
   * sign
   * @param pkey is hex string of private key
   */
  public sign(pkey: string) {
    this.transactionWitness.push(this.justSign(pkey))
  }

  public justSign(pkey: string) {
    const key = new utils.SigningKey(pkey)
    return utils.joinSignature(key.signDigest(this.getTxHash()))
  }

  public getTxBytes() {
    return HexUtil.concat(this.stateUpdates.map(tx => tx.encode()))
  }

  public hash() {
    return this.getTxHash()
  }

  public getTxHash() {
    return utils.keccak256(this.getTxBytes())
  }

  public getSegments() {
    const segments = this.stateUpdates.reduce(
      (segments: Segment[], StateUpdate) => {
        return segments.concat([StateUpdate.getSegment()])
      },
      []
    )
    segments.sort((a, b) => {
      if (a.start.gt(b.start)) {
        return 1
      } else if (a.start.lt(b.start)) {
        return -1
      } else {
        return 0
      }
    })
    return segments
  }

  /**
   *
   * @description txs[txIndex].getOutputs(outputIndex)
   */
  public getIndex(segment: Segment): any {
    let result
    this.stateUpdates.forEach((stateUpdate, txIndex) => {
      const s = stateUpdate.getSegment()
      if (s.start.eq(segment.start)) {
        result = {
          txIndex
        }
      }
    })
    if (!result) {
      throw new Error('error')
    }
    return result
  }

  public getTransactionWitness() {
    return HexUtil.concat(this.transactionWitness)
  }

  public getSigners(): Address[] {
    return this.transactionWitness.map(sig =>
      utils.recoverAddress(this.getTxHash(), sig)
    )
  }

  public serialize() {
    return {
      states: this.stateUpdates.map(stateUpdate => stateUpdate.serialize()),
      tw: this.transactionWitness
    }
  }
}
