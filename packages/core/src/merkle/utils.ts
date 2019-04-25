import { utils } from 'ethers'
import BigNumber = utils.BigNumber


/**
 * bignumTo8BytesBuffer
 * @param {BigNumber} bn
 */
export function bignumTo8BytesBuffer(bn: BigNumber): Buffer {
  const str = bn.toHexString()
  return Buffer.from(utils.hexZeroPad(str, 8).substr(2), 'hex')
}

/**
 * bignumTo32BytesBuffer
 * @param {BigNumber} bn
 */
export function bignumTo32BytesBuffer(bn: BigNumber): Buffer {
  const str = bn.toHexString()
  return Buffer.from(utils.hexZeroPad(str, 32).substr(2), 'hex')
}