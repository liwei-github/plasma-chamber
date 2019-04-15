import { constants } from 'ethers'
import {
  SignedTransaction,
  SignedTransactionWithProof,
  StateUpdate,
  SumMerkleProof,
  PredicatesManager,
  BaseStateManager
} from '@layer2/core'

export class StateManager extends BaseStateManager {

  constructor(predicatesManager: PredicatesManager) {
    super(predicatesManager)
  }
  
  isContain(tx: SignedTransactionWithProof): boolean {
    return this._isContain(tx.getTxHash(), tx, tx.getTransactionWitness())
  }

  spend(tx: SignedTransactionWithProof) {
    return this._spend(tx.getTxHash(), tx, tx.getTransactionWitness())
  }

  insert(tx: SignedTransactionWithProof) {
    return this._insert(tx)
  }

  insertDepositTx(depositTx: StateUpdate) {
    return this._insert(new SignedTransactionWithProof(
      new SignedTransaction([depositTx]),
      0,
      '0x',
      '0x',
      constants.Zero,
      // 0x00000050 is header. 0x0050 is size of deposit transaction
      [new SumMerkleProof(1, 0, depositTx.getSegment(), '', '0x00000050')],
      depositTx.getBlkNum()))
  }

  getSignedTransactionWithProofs(): SignedTransactionWithProof[] {
    return this.getLeaves() as SignedTransactionWithProof[]
  }
  
  serialize() {
    const states: SignedTransactionWithProof[] = this.getLeaves() as SignedTransactionWithProof[]
    return states.map(l => l.serialize())
  }

  deserialize(data: any[]) {
    this.leaves = data.map(d => {
      return SignedTransactionWithProof.deserialize(d)
    })
  }

}
