const {
  BN,
  expectEvent,
  expectRevert,
  constants: { ZERO_ADDRESS }
} = require('@openzeppelin/test-helpers')
const { expect } = require('chai')
const { fixSigV } = require('../utils')

const GnosisSafe = artifacts.require('GnosisSafe')
const GnosisSafeProxyFactory = artifacts.require('GnosisSafeProxyFactory')
const ActionPoints = artifacts.require('ActionPoints')

const GnosisSafeAdapter = artifacts.require('GnosisSafeAdapter')

contract('GnosisSafeAdapter', ([deployer1, main1, main2, main3, user1, attacker1, attacker2]) => {
  beforeEach(async () => {
    this.gnosisSafeMain = await GnosisSafe.new()
    this.proxyFactory = await GnosisSafeProxyFactory.new()
    this.owners = [main1, main2, main3]
    this.owners.sort()

    const setupArgs = [
      this.owners,
      '2',
      ZERO_ADDRESS,
      '0x',
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      '0',
      ZERO_ADDRESS
    ]
    const gnosisSafeData = await this.gnosisSafeMain.contract.methods
      .setup(...setupArgs)
      .encodeABI()

    const { logs } = await this.proxyFactory.createProxy(
      this.gnosisSafeMain.address,
      gnosisSafeData
    )
    const realProxyAddr = logs[0].args.proxy
    this.gnosisSafe = await GnosisSafe.at(realProxyAddr)

    this.apToken = await ActionPoints.new({ from: deployer1 })
    this.totalAllocationAmount = new BN(web3.utils.toWei('23'))
    await this.apToken.allocateCoins(this.totalAllocationAmount, { from: deployer1 })

    this.gnosisAdapter = await GnosisSafeAdapter.new({ from: deployer1 })

    await this.gnosisAdapter.transferOwnership(this.gnosisSafe.address, { from: deployer1 })
    await this.apToken.transferOwnership(this.gnosisAdapter.address, { from: deployer1 })
  })

  it('setup conditions', async () => {
    expect(await this.apToken.owner()).to.equal(this.gnosisAdapter.address)
    expect(await this.apToken.totalAllocatedSupply()).to.be.bignumber.equal(
      this.totalAllocationAmount,
      'wrong initial allocation'
    )
  })

  it('can mint via signature only once', async () => {
    const nonce = '0'
    const mintAmount = new BN(web3.utils.toWei('6'))
    const innerMessageToSign = await this.gnosisAdapter.messageToSign(nonce, mintAmount, user1)
    const gnosisMessageHash = await this.gnosisSafe.getMessageHash(innerMessageToSign)

    const sig1 = fixSigV(await web3.eth.sign(gnosisMessageHash, this.owners[0]))
    const sig2 = fixSigV(await web3.eth.sign(gnosisMessageHash, this.owners[1]))
    const sigData = '0x' + sig1.slice(2) + sig2.slice(2)

    const supplyBefore = await this.apToken.totalSupply()
    const allocatedTokensBefore = await this.apToken.allocatedTokens()
    const totalAllocatedSupplyBefore = await this.apToken.totalAllocatedSupply()

    const { tx: initialMintTxId } = await this.apToken.mintWithOwnerData(
      nonce,
      mintAmount,
      sigData,
      { from: user1 }
    )

    const supplyAfter = await this.apToken.totalSupply()
    const allocatedTokensAfter = await this.apToken.allocatedTokens()
    const totalAllocatedSupplyAfter = await this.apToken.totalAllocatedSupply()

    expect(supplyAfter.sub(supplyBefore)).to.be.bignumber.equal(
      mintAmount,
      'Supply incorrectly adjusted'
    )
    expect(allocatedTokensBefore.sub(allocatedTokensAfter)).to.be.bignumber.equal(
      mintAmount,
      'Allocated tokens incorrectly adjusted'
    )
    expect(totalAllocatedSupplyAfter).to.be.bignumber.equal(
      totalAllocatedSupplyBefore,
      'Total allocated supply shouldn\'t change'
    )

    await expectEvent.inTransaction(initialMintTxId, this.gnosisAdapter, 'HashUsed', {
      nonce,
      amount: mintAmount,
      recipient: user1
    })
    expect(await this.apToken.balanceOf(user1)).to.be.bignumber.equal(mintAmount)

    await expectRevert(
      this.apToken.mintWithOwnerData(nonce, mintAmount, sigData, { from: user1 }),
      'Hash already used'
    )
  })

  it('cannot mint, even with valid signature if insufficient tokens were allocated ', async () => {
    const nonce = '1'
    const mintAmount = this.totalAllocationAmount.add(new BN(web3.utils.toWei('1')))
    const innerMessageToSign = await this.gnosisAdapter.messageToSign(nonce, mintAmount, user1)
    const gnosisMessageHash = await this.gnosisSafe.getMessageHash(innerMessageToSign)

    const sig1 = fixSigV(await web3.eth.sign(gnosisMessageHash, this.owners[0]))
    const sig2 = fixSigV(await web3.eth.sign(gnosisMessageHash, this.owners[1]))
    const sigData = '0x' + sig1.slice(2) + sig2.slice(2)

    await expectRevert(
      this.apToken.mintWithOwnerData(nonce, mintAmount, sigData, { from: user1 }),
      'Insufficient tokens allocated'
    )
  })

  it('cannot mint with arbirary signature', async () => {
    const nonce = '2'
    const mintAmount = this.totalAllocationAmount
    const innerMessageToSign = await this.gnosisAdapter.messageToSign(nonce, mintAmount, attacker1)
    const gnosisMessageHash = await this.gnosisSafe.getMessageHash(innerMessageToSign)

    const attackers = [attacker1, attacker2]
    attackers.sort()

    const sig1 = fixSigV(await web3.eth.sign(gnosisMessageHash, attackers[0]))
    const sig2 = fixSigV(await web3.eth.sign(gnosisMessageHash, attackers[1]))
    const sigData = '0x' + sig1.slice(2) + sig2.slice(2)

    await expectRevert(
      this.apToken.mintWithOwnerData(nonce, mintAmount, sigData, { from: attacker1 }),
      'Invalid owner provided'
    )
  })
})
