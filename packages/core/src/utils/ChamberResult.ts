import { ChamberError } from './error'

export interface ChamberResult<T> {
  isOk(): boolean
  isError(): boolean
  ok(): T
  error(): ChamberError
}
