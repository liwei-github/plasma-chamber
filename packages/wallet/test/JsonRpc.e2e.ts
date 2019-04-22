import { describe, it } from "mocha"
import {
  JsonRpcClient,
} from '../src/client'
import { assert } from "chai"
import CDP from 'chrome-remote-interface'

// const injectScript = `
// const client = new JsonRpcClient('https://google.com')
// const methodName = ''
// const args = []
// let json = await client.request(methodName, args)
// return json
// `
const injectScript = `return true`

describe('JsonRpcClient', () => {
  it('should run fetch on NodeJS', async () => {
    try {
      const { Runtime } = await CDP()
      const {result, exceptionDetails} = await Runtime.evaluate({
        awaitPromise: true,
        expression: `(async () => { ${injectScript} })()`
      });
      console.log('result, exceptionDetails:', result, exceptionDetails)
    } catch(e) { 
      console.log(e.message)
    }
  }).timeout(10000)
})