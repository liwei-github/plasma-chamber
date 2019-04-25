import { utils } from 'ethers'
import BigNumber = utils.BigNumber
import { Segment } from '../segment'
import { Address } from '../helpers/types'
import { DecoderUtility } from '../utils/Decoder'
import { StateUpdate } from '../StateUpdate'

export class PaymentChannelPredicate {
  public static create(
    segment: Segment,
    blkNum: BigNumber,
    predicate: Address,
    hash: string,
    participant1: Address,
    participant2: Address,
    stateIndex: number
  ) {
    return new StateUpdate(
      segment,
      blkNum,
      predicate,
      DecoderUtility.encode([
        hash,
        participant1,
        participant2,
        utils.bigNumberify(stateIndex).toHexString()
      ])
    )
  }

  public static verifyDeprecation(
    hash: string,
    stateUpdate: StateUpdate,
    deprecationWitness: string,
    nextStateUpdate: StateUpdate
  ): boolean {
    const isContain = stateUpdate.segment.isContain(nextStateUpdate.segment)
    const decoded = DecoderUtility.decode(stateUpdate.state)
    const isCorrectSig1 =
      utils.recoverAddress(
        hash,
        utils.hexDataSlice(deprecationWitness, 0, 65)
      ) === DecoderUtility.getAddress(decoded[0])
    const isCorrectSig2 =
      utils.recoverAddress(
        hash,
        utils.hexDataSlice(deprecationWitness, 65, 130)
      ) === DecoderUtility.getAddress(decoded[1])
    return isContain && isCorrectSig1 && isCorrectSig2
  }

  public static isOwnedBy(owner: Address, stateUpdate: StateUpdate): boolean {
    const decoded = DecoderUtility.decode(stateUpdate.state)
    return decoded.map(d => utils.getAddress(d)).indexOf(owner) >= 0
  }
}
