import { describe, it } from 'mocha'
import { ChamberWallet } from '../src'
import { PlasmaClient } from '../src/client'
import { assert } from 'chai'
import { utils } from 'ethers'
import { MockStorage } from '../src/storage/MockStorage'
import { MockNetworkClient } from './mock/MockNetworkClient'
import { MockPubsubClient } from './mock/MockPubsubClient'

describe('ChamberWallet', () => {
  const AlicePrivateKey =
    '0xe88e7cda6f7fae195d0dcda7ccb8d733b8e6bb9bd0bc4845e1093369b5dc2257'
  const AliceAddress = utils.computeAddress(AlicePrivateKey)
  const ContractAddress = '0xfb88de099e13c3ed21f80a7a1e49f8caecf10df6'
  const mockClient = new MockNetworkClient()
  const client = new PlasmaClient(mockClient, new MockPubsubClient())
  let storage = new MockStorage()
  const predicate = AliceAddress
  const options = {
    OwnershipPredicate: predicate
  }

  beforeEach(() => {
    storage = new MockStorage()
  })

  it('should create wallet', () => {
    const wallet = ChamberWallet.createWalletWithPrivateKey(
      client,
      'http://127.0.0.1:8545',
      ContractAddress,
      storage,
      AlicePrivateKey,
      options
    )
    assert.equal(wallet.getBalance().toNumber(), 0)
  })

  describe('handleDeposit', () => {
    const wallet = ChamberWallet.createWalletWithPrivateKey(
      client,
      'http://127.0.0.1:8545',
      ContractAddress,
      storage,
      AlicePrivateKey,
      options
    )
    wallet.setPredicate('OwnershipPredicate', predicate)

    it('should handleDeposit', () => {
      wallet.handleDeposit(
        AliceAddress,
        utils.bigNumberify(0),
        utils.bigNumberify(0),
        utils.bigNumberify(10000000),
        utils.bigNumberify(2)
      )
      assert.equal(wallet.getBalance().toNumber(), 10000000)
    })
  })

  describe('getExits', () => {
    const wallet = ChamberWallet.createWalletWithPrivateKey(
      client,
      'http://127.0.0.1:8545',
      ContractAddress,
      storage,
      AlicePrivateKey,
      options
    )
    wallet.setPredicate('OwnershipPredicate', predicate)

    it('should getExit', () => {
      const blkNum = utils.bigNumberify(2)
      const depositTx = wallet.handleDeposit(
        AliceAddress,
        utils.bigNumberify(0),
        utils.bigNumberify(0),
        utils.bigNumberify(10000000),
        blkNum
      )

      wallet.handleExit(
        utils.bigNumberify(1),
        depositTx.hash(),
        utils.bigNumberify(1520700),
        utils.bigNumberify(10000000)
      )

      assert.equal(wallet.getExits().length, 1)
    })
  })

  describe('transfer', () => {
    const wallet = ChamberWallet.createWalletWithPrivateKey(
      client,
      'http://127.0.0.1:8545',
      ContractAddress,
      storage,
      AlicePrivateKey
    )
    wallet.setPredicate('OwnershipPredicate', predicate)

    it('should transfer', async () => {
      wallet.handleDeposit(
        AliceAddress,
        utils.bigNumberify(0),
        utils.bigNumberify(0),
        utils.bigNumberify(10000000),
        utils.bigNumberify(2)
      )
      await wallet.transfer(AliceAddress, 1, '2000000')
    })
  })
})
