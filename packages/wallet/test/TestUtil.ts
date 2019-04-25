import { utils } from 'ethers'
import BigNumber = utils.BigNumber
import {
  OwnershipPredicate,
  Segment,
  SignedTransaction
} from "@layer2/core"

export function createTransfer(privKey: string, predicate: string, seg: Segment, blkNum: BigNumber, to: string) {
  const stateUpdate = OwnershipPredicate.create(seg, blkNum, predicate, to)
  const tx= new SignedTransaction([stateUpdate])
  tx.sign(privKey)
  return tx
}

export const AlicePrivateKey = '0xe88e7cda6f7fae195d0dcda7ccb8d733b8e6bb9bd0bc4845e1093369b5dc2257'
export const BobPrivateKey = '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f'
