import { SignedTransaction } from './SignedTransaction'
import { StateUpdate, PredicatesManager } from './StateUpdate'
import { Segment } from './segment'
import { StateValidator } from './state/StateValidator';

export class SegmentChecker extends StateValidator {

  constructor(predicatesManager: PredicatesManager) {
    super(predicatesManager)
  }
  
  isContain(tx: SignedTransaction): boolean {
    return tx.getStateUpdates().reduce((isContain, i) => {
      return isContain && this._isContain(tx.getTxHash(), i, tx.getTransactionWitness())
    }, <boolean>true)
  }

  spend(tx: SignedTransaction) {
    return tx.getStateUpdates().map((i) => {
      return this._spend(tx.getTxHash(), i, tx.getTransactionWitness())
    })
  }

  insert(tx: SignedTransaction) {
    return tx.getStateUpdates().map((o) => {
      return this._insert(o)
    })
  }

  insertDepositTx(deposit: StateUpdate) {
    return this._insert(deposit)
  }

  startExit(segment: Segment) {
    this.leaves = this.leaves.filter(l => !l.getSegment().toBigNumber().eq(segment.toBigNumber()))
  }

  getStateUpdates(): StateUpdate[] {
    return this.getLeaves() as StateUpdate[]
  }
  
  serialize() {
    const states: StateUpdate[] = this.getLeaves() as StateUpdate[]
    return states.map(l => l.serialize())
  }

  deserialize(data: any[]) {
    this.leaves = data.map(d => {
      return StateUpdate.deserialize(d)
    })
  }

}
