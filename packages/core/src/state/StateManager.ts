import { SignedTransaction } from '../SignedTransaction'
import { StateUpdate, PredicatesManager } from '../StateUpdate'
import { BaseStateManager } from './BaseStateManager';

export class StateManager extends BaseStateManager {

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
