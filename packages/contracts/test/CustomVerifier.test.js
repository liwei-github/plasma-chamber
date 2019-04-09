const CustomVerifier = artifacts.require("CustomVerifier")
const VerifierUtil = artifacts.require("VerifierUtil")
const OwnershipPredicateContract = artifacts.require("OwnershipPredicate")
const SwapChannelPredicate = artifacts.require("SwapChannelPredicate")
const { constants, utils } = require('ethers')
const BigNumber = utils.BigNumber
const {
  assertRevert
} = require('./helpers/assertRevert')
const {
  transactions,
  testAddresses,
  testKeys
} = require('./testdata')
const {
  OwnState,
  Segment,
  SignedTransaction,
  OwnershipPredicate,
  PaymentChannelPredicate
} = require('@layer2/core')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract("CustomVerifier", ([alice, bob, operator, user4, user5, admin]) => {

  beforeEach(async () => {
    this.verifierUtil = await VerifierUtil.new({ from: operator })
    this.ownershipPredicate = await OwnershipPredicateContract.new(
      this.verifierUtil.address, { from: operator })
    this.swapChannelPredicate = await SwapChannelPredicate.new(
      this.verifierUtil.address,
      this.verifierUtil.address,
      { from: operator })
    this.customVerifier = await CustomVerifier.new(
      this.verifierUtil.address,
      this.ownershipPredicate.address,
      {
        from: operator
      })
    await this.customVerifier.registerPredicate(this.ownershipPredicate.address, {from: operator})
  });

  describe("OwnershipPredicate", () => {

    it("can initiate exit", async () => {
      const segment = Segment.ETH(utils.bigNumberify('0'), utils.bigNumberify('1000000'))
      const stateUpdate = OwnershipPredicate.create(
        segment,
        utils.bigNumberify(4),
        this.ownershipPredicate.address,
        testAddresses.AliceAddress
      )
      const signedTx = new SignedTransaction([stateUpdate])
      const canInitiateExit = await this.customVerifier.canInitiateExit(
        signedTx.getTxHash(),
        signedTx.getTxBytes(),
        testAddresses.AliceAddress,
        segment.toBigNumber(),
        {
          from: alice
        });
      assert.isTrue(canInitiateExit)
    })

    it("can't initiate exit", async () => {
      const segment = Segment.ETH(utils.bigNumberify('0'), utils.bigNumberify('1000000'))
      const stateUpdate = OwnershipPredicate.create(
        segment,
        utils.bigNumberify(4),
        this.ownershipPredicate.address,
        testAddresses.BobAddress
      )
      const signedTx = new SignedTransaction([stateUpdate])

      await assertRevert(this.customVerifier.canInitiateExit(
        signedTx.getTxHash(),
        signedTx.getTxBytes(),
        testAddresses.AliceAddress,
        transactions.segments[0].toBigNumber(),
        {
          from: alice
        }))
    })

    it("can't initiate exit because of invalid segment", async () => {
      const tx = transactions.tx
      await assertRevert(this.customVerifier.canInitiateExit(
        tx.getTxHash(),
        tx.getTxBytes(),
        constants.AddressZero,
        transactions.segments[1].toBigNumber(),
        {
          from: alice
        }))
    })

    describe("verifyDeprecation", () => {
      const segment = Segment.ETH(utils.bigNumberify('0'), utils.bigNumberify('1000000'))
      let signedTx1
      let signedTx2

      beforeEach(async () => {
        const stateUpdate1 = OwnershipPredicate.create(
          segment,
          utils.bigNumberify(4),
          this.ownershipPredicate.address,
          testAddresses.AliceAddress
        )
        const stateUpdate2 = OwnershipPredicate.create(
          segment,
          utils.bigNumberify(4),
          this.ownershipPredicate.address,
          testAddresses.BobAddress
        )
        signedTx1 = new SignedTransaction([stateUpdate1])
        signedTx2 = new SignedTransaction([stateUpdate2])
      });

      it("can verify deprecation", async () => {
        signedTx2.sign(testKeys.AlicePrivateKey)
        const verifyDeprecation = await this.customVerifier.verifyDeprecation(
          signedTx2.getTxHash(),
          signedTx1.getTxBytes(),
          signedTx2.getTxBytes(),
          signedTx2.getTransactionWitness(),
          0,
          {
            from: alice
          });
        assert.isTrue(verifyDeprecation)
      })
  
      it("can't verify deprecation", async () => {
        signedTx2.sign(testKeys.BobPrivateKey)
        await assertRevert(this.customVerifier.verifyDeprecation(
          signedTx2.getTxHash(),
          signedTx1.getTxBytes(),
          signedTx2.getTxBytes(),
          signedTx2.getTransactionWitness(),
          0,
          {
            from: alice
          }))
      })      
    })

  })

  describe("SwapChannelPredicate", () => {

    it("can initiate exit", async () => {
      const segment1 = Segment.ETH(utils.bigNumberify('0'), utils.bigNumberify('1000000'))
      const segment2 = Segment.ETH(utils.bigNumberify('2000000'), utils.bigNumberify('3000000'))
      const id = utils.keccak256(utils.hexlify(utils.concat([
        utils.arrayify(segment1.toBigNumber()),
        utils.arrayify(segment2.toBigNumber()),
        utils.arrayify(testAddresses.AliceAddress),
        utils.arrayify(testAddresses.BobAddress)
      ])))
      const stateUpdate1 = PaymentChannelPredicate.create(
        segment1,
        utils.bigNumberify(6),
        this.swapChannelPredicate.address,
        id,
        testAddresses.AliceAddress,
        testAddresses.BobAddress,
        1
      )
      const stateUpdate2 = PaymentChannelPredicate.create(
        segment2,
        utils.bigNumberify(6),
        this.swapChannelPredicate.address,
        id,
        testAddresses.AliceAddress,
        testAddresses.BobAddress,
        2
      )
      const signedTx = new SignedTransaction([stateUpdate1, stateUpdate2])
      const canInitiateExit = await this.customVerifier.canInitiateExit(
        signedTx.getTxHash(),
        stateUpdate1.encode(),
        testAddresses.AliceAddress,
        segment1.toBigNumber(),
        {
          from: alice
        });
      assert.isTrue(canInitiateExit)
    })

  })

 /*
  describe("register", () => {

    const blkNum = utils.bigNumberify('3')
    const segment = Segment.ETH(
      utils.bigNumberify('5000000'),
      utils.bigNumberify('5100000'))

    const escrowTx = new SignedTransaction([new EscrowTransaction(
      testAddresses.AliceAddress,
      segment,
      blkNum,
      testAddresses.OperatorAddress,
      testAddresses.BobAddress,
      utils.bigNumberify('12000000'))])
    escrowTx.sign(testKeys.AlicePrivateKey)

    it("should addVerifier", async () => {
      await this.customVerifier.addVerifier(
        this.escrowTxVerifier.address,
        {
          from: operator
        });

      const exitState = new OwnState(segment, alice).withBlkNum(blkNum)
      const evidence = await this.customVerifier.getSpentEvidence(
        escrowTx.getTxBytes(),
        0,
        escrowTx.getSignatures()
      )
      const result = await this.customVerifier.isSpent(
        escrowTx.getTxHash(),
        exitState.getBytes(),
        evidence,
        0,
        {
          from: alice
        });
      assert.equal(result, true)
    })

  })
  */

  describe("parseSegment", () => {

    it("should be parsed", async () => {
      const result = await this.verifierUtil.parseSegment(
        transactions.segment45.toBigNumber(),
        {
          from: alice
        });
      assert.equal(result[0].toNumber(), 0)
      assert.equal(result[1].toNumber(), transactions.segment45.start.toNumber())
      assert.equal(result[2].toNumber(), transactions.segment45.end.toNumber())
    })

    it("should be encoded", async () => {
      const result = await this.verifierUtil.encodeSegment(
        transactions.segment45.getTokenId(),
        transactions.segment45.start,
        transactions.segment45.end,
        {
          from: alice
        });
      assert.equal(result.toString(), transactions.segment45.toBigNumber().toString())
    })

  })

})
