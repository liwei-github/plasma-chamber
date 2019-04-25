import { utils } from 'ethers'
import BigNumber = utils.BigNumber
import { Segment } from '../segment'
import { Address } from '../helpers/types'
import { DecoderUtility } from '../utils/Decoder'
import { StateUpdate } from '../StateUpdate'

export class OwnershipPredicate {
  public static create(
    segment: Segment,
    blkNum: BigNumber,
    predicate: Address,
    owner: Address
  ) {
    return new StateUpdate(
      segment,
      blkNum,
      predicate,
      DecoderUtility.encode([owner])
    )
  }

  public static verifyDeprecation(
    hash: string,
    stateUpdate: StateUpdate,
    deprecationWitness: string,
    nextStateUpdate: StateUpdate
  ): boolean {
    const isContain = stateUpdate.segment.isContain(nextStateUpdate.segment)
    const isCorrectSig =
      utils.recoverAddress(hash, deprecationWitness) ===
      DecoderUtility.getAddress(stateUpdate.state)
    return isContain && isCorrectSig
  }

  public static isOwnedBy(owner: Address, stateUpdate: StateUpdate): boolean {
    const address32 = DecoderUtility.decode(stateUpdate.state)[0]
    return DecoderUtility.getAddress(address32) === utils.getAddress(owner)
  }
}
