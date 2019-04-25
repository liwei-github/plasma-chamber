import {
  Segment,
  SignedTransaction,
  SignedTransactionWithProof,
  StateUpdate,
  OwnershipPredicate,
  Address
} from '@layer2/core'
import { utils } from 'ethers'
import BigNumber = utils.BigNumber

export class TransferAlgorithm {
  public static searchUtxo(
    utxos: SignedTransactionWithProof[],
    targetBlockNumber: number,
    ownershipPredicate: string,
    to: Address,
    tokenId: number,
    amount: BigNumber,
    feeTo?: Address,
    fee?: BigNumber
  ): SignedTransaction | null {
    let transferTx: SignedTransaction | null = null
    const targetBlock = utils.bigNumberify(targetBlockNumber)
    utxos
      .filter(tx =>
        tx
          .getOutput()
          .getSegment()
          .getTokenId()
          .eq(tokenId)
      )
      .forEach(tx => {
        const output = tx.getOutput()
        const segment = output.getSegment()
        const sum = amount.add(fee || 0)
        if (segment.getAmount().gte(sum)) {
          const paymentTx = OwnershipPredicate.create(
            new Segment(
              segment.getTokenId(),
              segment.start,
              segment.start.add(amount)
            ),
            targetBlock,
            ownershipPredicate,
            to
          )
          if (feeTo && fee) {
            const feeStart = segment.start.add(amount)
            const feeTx = OwnershipPredicate.create(
              new Segment(segment.getTokenId(), feeStart, feeStart.add(fee)),
              targetBlock,
              ownershipPredicate,
              feeTo
            )
            transferTx = new SignedTransaction([paymentTx, feeTx])
          } else {
            transferTx = new SignedTransaction([paymentTx])
          }
        }
      })
    return transferTx
  }
}
