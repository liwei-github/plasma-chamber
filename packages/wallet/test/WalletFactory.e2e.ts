const path = require('path')
require('dotenv').config({path: path.resolve(process.cwd(), './test/.env.test')})
import { describe, it } from "mocha"
import WalletFactory from '../src/factory'
import { assert } from "chai"
import CDP from 'chrome-remote-interface'

const privateKey:string|undefined = process.env.PRIVATE_KEY || ''

const injectScript = `
  const factory = new ${WalletFactory}(
    '${process.env.CHILDCHAIN_ENDPOINT}',
    '${process.env.CHILDCHAIN_PUBSUB_ENDPOINT}',
    ${process.env.INITIAL_BLOCK},
    ${process.env.CONFIRMATION},
    '${process.env.OWNERSHIP_PREDICATE}',
    '${process.env.ROOTCHAIN_ENDPOINT}',
    '${process.env.ROOTCHAIN_ADDRESS}'
  );
  let wallet = await factory.createWallet({privateKey:'${privateKey}'})
  return !!wallet
`
console.log('injectScript: ', injectScript)

describe('JsonRpcClient', () => {
  it('should create wallet on CommonJS', async () => {
    try {
      const { Runtime } = await CDP()
      const {result, exceptionDetails} = await Runtime.evaluate({
        awaitPromise: true,
        expression: `(async () => { ${injectScript} })()`
      });
      if(exceptionDetails) throw new Error(exceptionDetails)

      assert.equal(result.value, true)
    } catch(e) { 
      throw new Error(e)
    }
  }).timeout(10000)
  it('should create wallet on NodeJS', async () => {
    try {
      const factory = new WalletFactory(
        process.env.CHILDCHAIN_ENDPOINT,
        process.env.CHILDCHAIN_PUBSUB_ENDPOINT,
        0,
        1,
        process.env.OWNERSHIP_PREDICATE || '',
        process.env.ROOTCHAIN_ENDPOINT || '',
        process.env.ROOTCHAIN_ADDRESS || ''
      );
      let wallet = await factory.createWallet({privateKey: privateKey})
      assert.equal(!!wallet, true)
    } catch(e) { 
      throw new Error(e)
    }
  })
})