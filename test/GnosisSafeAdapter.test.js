const {
  BN,
  expectEvent,
  expectRevert,
  constants: { ZERO_ADDRESS }
} = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

const GnosisSafe = artifacts.require('GnosisSafe')
const GnosisSafeProxyFactory = artifacts.require('GnosisSafeProxyFactory')
const ActionPoints = artifacts.require('ActionPoints')

const GnosisSafeAdapter = artifacts.require('GnosisSafeAdapter')

contract('GnosisSafeAdapter', ([deployer1, user1, user2, user3]) => {
  beforeEach(async () => {
    this.gnosisSafeMain = await GnosisSafe.new()
    this.proxyFactory = await GnosisSafeProxyFactory.new()

    const setupArgs = [
      [user1, user2, user3],
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
    this.gnosisAdapter = await GnosisSafeAdapter.new({ from: deployer1 })

    await this.gnosisAdapter.transferOwnership(this.gnosisSafe.address, { from: deployer1 })
    await this.apToken.transferOwnership(this.gnosisAdapter.address, { from: deployer1 })
  })

  it('empty test', async () => {})
})
