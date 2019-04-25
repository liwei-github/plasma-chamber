import { ChamberResult } from './ChamberResult'
import { ChamberError } from './error'

export class ChamberOk<T> implements ChamberResult<T> {
  private value: T

  constructor(v: T) {
    this.value = v
  }

  public isOk(): boolean {
    return true
  }

  public isError(): boolean {
    return false
  }

  public ok(): T {
    return this.value
  }

  public error(): ChamberError {
    throw new Error('ok.error')
  }
}
