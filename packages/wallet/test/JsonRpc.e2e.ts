import { describe, it } from "mocha"
import {
  JsonRpcClient,
} from '../src/client'
import { assert } from "chai"
import { CDP } from 'chrome-remote-interface'

const { Runtime } = new CDP()
console.log(Runtime)


describe('JsonRpcClient', () => {
  it('should run fetch on NodeJS', (done) => {
    const client = new JsonRpcClient('endpoint')
    const methodName = ''
    const args = []
    client.request(methodName, args).then(json=>{
      assert.equal(0, 0)
      done()
    })
  })
  it('should run fetch on CommonJS', (done) => {
    const script = ""
    runBrowser(script, done).then(_=>{
    })
  })
})




async function runBrowser(_script:string, done){
  const Tester = require('chrome-tester');
  const tester = new Tester();
  await tester.init();
  const job = {
    url: 'localhost:8082',
    tests: [
      {
        des: 'succ test',
        script: _script
      }
    ]
  }
  const executor = await tester.exec(job);


  const client = new JsonRpcClient('endpoint')
  const methodName = ''
  const args = []
  executor.on('test-pass', (test, value) => {
    client.request(methodName, args).then(json=>{
      console.log('test-pass');
      assert.equal(test.des, 'succ test');
      assert.equal(value, true);
      done()
    })
  });
  executor.on('test-failed', (test, exceptionDetails) => {
    client.request(methodName, args).then(json=>{
      console.log('test-failed');
      assert.equal(test.des, 'fail test');
      assert.equal(exceptionDetails.exception.value, 1);
      done()
    })
  });
  await executor.wait();
  const dom = await executor.getDOM();
  await tester.destroy();
}