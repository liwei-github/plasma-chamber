import { describe, it } from "mocha"
import WalletFactory from '../src/factory'
import { assert } from "chai"
import CDP from 'chrome-remote-interface'

const injectScript = `
  const factory = new ${WalletFactory}(
    ${process.env.CHILDCHAIN_ENDPOINT},
    ${process.env.CHILDCHAIN_PUBSUB_ENDPOINT},
    ${process.env.INITIAL_BLOCK},
    ${process.env.CONFIRMATION},
    ${process.env.OWNERSHIP_PREDICATE},
    ${process.env.ROOTCHAIN_ENDPOINT},
    ${process.env.ROOTCHAIN_ADDRESS}
  );
  let wallet = await factory.loadWallet()
  return !!wallet
`

describe('JsonRpcClient', () => {
  it('should load wallet on CommonJS', async () => {
    try {
      const { Runtime } = await CDP()
      const {result, exceptionDetails} = await Runtime.evaluate({
        awaitPromise: true,
        expression: `(async () => { ${injectScript} })()`
      });
      if(exceptionDetails) throw new Error(exceptionDetails)

      assert.equal(result.value, true)
    } catch(e) { 
      throw new Error(e.message)
    }
  }).timeout(10000)
  it('should load wallet on NodeJS', async () => {
    try {
      const bool = await eval(`(async () => { ${injectScript} })()`)

      assert.equal(bool, true)
    } catch(e) { 
      throw new Error(e.message)
    }
  })
})