const CustomVerifier = artifacts.require("CustomVerifier")
const VerifierUtil = artifacts.require("VerifierUtil")
const OwnStateVerifier = artifacts.require("OwnStateVerifier")
const StandardVerifier = artifacts.require("StandardVerifier")
const EscrowTxVerifier = artifacts.require("EscrowTxVerifier")
const EscrowStateVerifier = artifacts.require("EscrowStateVerifier")
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
  SplitTransaction,
  EscrowTransaction
} = require('@layer2/core')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract("CustomVerifier", ([alice, bob, operator, user4, user5, admin]) => {

  beforeEach(async () => {
    this.verifierUtil = await VerifierUtil.new({ from: operator })
    this.ownStateVerifier = await OwnStateVerifier.new(
      this.verifierUtil.address, { from: operator })
    this.EscrowStateVerifier = await EscrowStateVerifier.new(
      this.verifierUtil.address, { from: operator })
    this.standardVerifier = await StandardVerifier.new(
      this.verifierUtil.address,
      this.ownStateVerifier.address,
      { from: operator })
    this.escrowTxVerifier = await EscrowTxVerifier.new(
      this.verifierUtil.address,
      this.ownStateVerifier.address,
      this.EscrowStateVerifier.address,
      { from: operator })
    this.customVerifier = await CustomVerifier.new(
      this.verifierUtil.address,
      this.ownStateVerifier.address,
      {
        from: operator
      })
    // label: 10-19
    await this.customVerifier.addVerifier(this.standardVerifier.address, {from: operator})
    OwnState.setAddress(this.ownStateVerifier.address)

  });

  describe("TransferTransaction", () => {

    it("should be exit gamable", async () => {
      const tx = transactions.tx
      const isExitGamable = await this.customVerifier.isExitGamable(
        tx.getTxHash(),
        tx.getTxBytes(),
        tx.getSignatures(),
        0,
        testAddresses.BobAddress,
        transactions.segments[0].toBigNumber(),
        {
          from: alice
        });
      const output = await this.customVerifier.getOutput(
        transactions.segments[0].toBigNumber(),
        tx.getTxBytes(),
        6,
        {
          from: alice
        });
      assert.isTrue(isExitGamable)
      assert.equal(output, utils.keccak256(tx.getStateBytes(this.ownStateVerifier.address)))
    })

    it("should not be exit gamable", async () => {
      const invalidTx = transactions.invalidTx
      await assertRevert(this.customVerifier.isExitGamable(
        invalidTx.getTxHash(),
        invalidTx.getTxBytes(),
        invalidTx.getSignatures(),
        0,
        constants.AddressZero,
        transactions.segments[0].toBigNumber(),
        {
          from: alice
        }))
    })

    it("should not be exit gamable because of invalid segment", async () => {
      const tx = transactions.tx
      await assertRevert(this.customVerifier.isExitGamable(
        tx.getTxHash(),
        tx.getTxBytes(),
        tx.getSignatures(),
        0,
        constants.AddressZero,
        transactions.segments[1].toBigNumber(),
        {
          from: alice
        }))
    })

  })
  
  describe("MergeTransaction", () => {

    it("should be exit gamable", async () => {
      const tx = transactions.mergeTx
      const isExitGamable = await this.customVerifier.isExitGamable(
        tx.getTxHash(),
        tx.getTxBytes(),
        tx.getSignatures(),
        0,
        testAddresses.BobAddress,
        transactions.segment45.toBigNumber(),
        {
          from: alice
        });
      const output = await this.customVerifier.getOutput(
        transactions.segment45.toBigNumber(),
        tx.getTxBytes(),
        6,
        {
          from: alice
        });
      assert.isTrue(isExitGamable)
      assert.equal(output, utils.keccak256(tx.getStateBytes(this.ownStateVerifier.address)))
    })

  })

  describe("SwapTransaction", () => {
    const blkNum3 = utils.bigNumberify('3')
    const blkNum5 = utils.bigNumberify('5')

    const transfer1 = new SignedTransaction([new SplitTransaction(
        testAddresses.AliceAddress,
        Segment.ETH(
          utils.bigNumberify('5000000'),
          utils.bigNumberify('5100000')),
        blkNum3,
        testAddresses.OperatorAddress
      )])
    const transfer2 = new SignedTransaction([new SplitTransaction(
        testAddresses.OperatorAddress,
        Segment.ETH(
          utils.bigNumberify('5100000'),
          utils.bigNumberify('5200000')),
        blkNum5,
        testAddresses.AliceAddress,
      )])
    transfer1.sign(testKeys.AlicePrivateKey)
    transfer2.sign(testKeys.OperatorPrivateKey)

    it("should isSpent", async () => {
      const exitState1 = new OwnState(
        Segment.ETH(
          utils.bigNumberify('5000000'),
          utils.bigNumberify('5100000')),
        alice).withBlkNum(blkNum3)
      const exitState2 = new OwnState(
        Segment.ETH(
          utils.bigNumberify('5100000'),
          utils.bigNumberify('5200000')),
        operator).withBlkNum(blkNum5)
      const evidence2 = await this.customVerifier.getSpentEvidence(
        transfer1.getTxBytes(),
        0,
        transfer1.getSignatures()
      )
      const evidence3 = await this.customVerifier.getSpentEvidence(
        transfer2.getTxBytes(),
        0,
        transfer2.getSignatures()
      )
      const result2 = await this.customVerifier.isSpent(
        transfer1.getTxHash(),
        exitState1.getBytes(),
        evidence2,
        0,
        {
          from: alice
        });
      const result3 = await this.customVerifier.isSpent(
        transfer2.getTxHash(),
        exitState2.getBytes(),
        evidence3,
        0,
        {
          from: alice
        });
      assert.equal(result2, true)
      assert.equal(result3, true)
    })

  })

  describe("addVerifier", () => {

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
