import { SignedTransaction } from '@layer2/core'

export class FastTransferResponse {
  public sig: string
  public tx: SignedTransaction

  constructor(sig: string, tx: SignedTransaction) {
    this.sig = sig
    this.tx = tx
  }
}
