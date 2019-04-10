import { ChamberError } from '@layer2/core'

export class ChainErrorFactory {

  static BlockNotFound() {
    return new ChamberError(1000, 'block not found')
  }
  static InvalidTransaction() {
    return new ChamberError(1010, 'invalid transaction')
  }
  static AlreadySent() {
    return new ChamberError(1011, 'already sent')
  }
  static SegmentDuplicated() {
    return new ChamberError(1011, 'segment duplicated')
  }
  static UnknownError() {
    return new ChamberError(1020, 'unknown Error')
  }
  static NoValidTransactions() {
    return new ChamberError(1030, 'no valid transactions')
  }

}
