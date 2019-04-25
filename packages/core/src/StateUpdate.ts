import { Segment } from './segment'
import { BigNumber } from 'ethers/utils'
import { Address, RLPItem, Hash } from './helpers/types'
import { utils, constants } from 'ethers'
import RLP = utils.RLP
import { DecoderUtility } from './utils/Decoder'
import { IState } from './state/BaseStateManager'
import { PredicatesManager } from './predicates'

export class StateUpdate implements IState {
  public static deserialize(data: string) {
    return StateUpdate.fromTupl(RLP.decode(data))
  }

  public static fromTupl(data: RLPItem[]) {
    return new StateUpdate(
      Segment.fromBigNumber(utils.bigNumberify(data[0])),
      utils.bigNumberify(data[1]),
      utils.getAddress(data[2]),
      data[3]
    )
  }
  public segment: Segment
  public blkNum: BigNumber
  public predicate: Address
  // hex string
  public state: string

  constructor(
    segment: Segment,
    blkNum: BigNumber,
    predicate: Address,
    state: string
  ) {
    this.segment = segment
    this.blkNum = blkNum
    this.predicate = predicate
    this.state = state
  }

  public getSegment(): Segment {
    return this.segment
  }

  public getBlkNum(): BigNumber {
    return this.blkNum
  }

  public getRawState() {
    return this.state
  }

  public serialize() {
    return RLP.encode(this.encodeToTuple())
  }

  public encodeToTuple(): RLPItem[] {
    return [this.segment.toBigNumber(), this.blkNum, this.predicate, this.state]
  }

  /**
   * for RootChain contract
   */
  public encode(): string {
    const predicate = utils.padZeros(utils.arrayify(this.predicate), 32)
    const blkNum = utils.padZeros(utils.arrayify(this.blkNum), 32)
    const segment = utils.padZeros(
      utils.arrayify(this.segment.toBigNumber()),
      32
    )
    const stateBytes = utils.arrayify(this.state)
    return utils.hexlify(utils.concat([predicate, blkNum, segment, stateBytes]))
  }

  public getStateHash() {
    return this.hash()
  }

  public hash(): string {
    return utils.keccak256(this.encode())
  }

  public getSubStateUpdate(newSegment: Segment): StateUpdate {
    if (this.segment.isContain(newSegment)) {
      return new StateUpdate(
        newSegment,
        this.blkNum,
        this.predicate,
        this.state
      )
    } else {
      return this
    }
  }

  public getRemainingState(state: StateUpdate): StateUpdate[] {
    const newSegments = this.getSegment().sub(state.getSegment())
    return newSegments.map(s => {
      return new StateUpdate(s, this.getBlkNum(), this.predicate, this.state)
    })
  }

  public verifyDeprecation(
    hash: Hash,
    newStateUpdate: StateUpdate,
    deprecationWitness: string,
    predicatesManager: PredicatesManager
  ): boolean {
    try {
      return predicatesManager.verifyDeprecation(
        this.predicate,
        hash,
        this,
        deprecationWitness,
        newStateUpdate
      )
    } catch (e) {
      console.warn("can't verify deprecation because", e)
      return false
    }
  }

  // spesific methods

  public isOwnedBy(owner: Address, predicatesManager: PredicatesManager) {
    return predicatesManager.isOwnedBy(this.predicate, owner, this)
  }

  public getOwner() {
    return DecoderUtility.getAddress(this.state)
  }
}
