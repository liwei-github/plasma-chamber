#! /usr/bin/env node

const Logger = require('js-logger')
const { ChainManager } = require('./index');
const Rpc = require('./JsonRpc');
const leveldown = require('leveldown');
const path = require('path')
const fs = require('fs')

function getStorageOption() {
  const basePath = process.env.DB_BASEPATH || path.join(process.cwd(), '.plasmadb')
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath);
  }
  const fsOptions = {
    blockdb: leveldown(path.join(basePath, 'blockdb') ),
    metadb: leveldown(path.join(basePath, 'metadb')),
    snapshotdb: leveldown(path.join(basePath, 'snapshotdb'))
  }
  return fsOptions;
}

async function main() {
  const chainManager = new ChainManager(
    process.env.OPERATOR_PRIVATE_KEY,
    process.env.ROOTCHAIN_ENDPOINT,
    process.env.ROOTCHAIN_ADDRESS
  );
  const options = {
    confirmation: process.env.MAINCHAIN_CONFIRMATION || 0,
    initialBlock: process.env.MAINCHAIN_INITIAL_BLOCK || 1,
    OwnershipPredicate: process.env.OWNERSHIP_PREDICATE,
    logLevel: process.env.LOGLEVEL || 'warn'
  }
  console.log('options.confirmation', options.confirmation)
  console.log('options.initialBlock', options.initialBlock)
  console.log('options.logLevel', options.logLevel)
  Logger.useDefaults()
  switch(options.logLevel) {
    case 'error':
      Logger.setLevel(Logger.ERROR)
      break
    case 'warn':
      Logger.setLevel(Logger.WARN)
      break;
    case 'debug':
      Logger.setLevel(Logger.DEBUG)
      break
    case 'info':
      Logger.setLevel(Logger.INFO)
      break
  }
  await chainManager.start(
    Object.assign({}, options, getStorageOption()))
  Rpc.run(chainManager.getChain());
  return true;
}

main()
  .then(() => console.log('Chain running. RPC running.') )
  .catch(e=> console.error(e) );
