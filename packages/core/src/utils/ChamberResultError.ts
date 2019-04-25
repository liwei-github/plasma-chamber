import { ChamberResult } from './ChamberResult'
import { ChamberError } from './error'

export class ChamberResultError<T> implements ChamberResult<T> {
  public static getError<T>(code: number, message: string) {
    return new ChamberResultError<T>(new ChamberError(code, message))
  }
  private err: ChamberError

  constructor(error: ChamberError) {
    this.err = error
  }

  public isOk(): boolean {
    return false
  }

  public isError(): boolean {
    return true
  }

  public ok(): T {
    throw new Error('error.ok')
  }

  public error(): ChamberError {
    return this.err
  }
}
