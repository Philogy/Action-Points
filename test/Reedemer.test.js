const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

const ActionPoints = artifacts.require('ActionPoints')
const Redeemer = artifacts.require('Redeemer')
const TestFARM = artifacts.require('TestFARM')

const MAX_UINT256 = new BN('1').shln(256).sub(new BN('1'))

contract('Reedemer', ([main1, main2, main3, user1, user2]) => {
  beforeEach(async () => {
    // instantiate contracts
    this.apToken = await ActionPoints.new({ from: main1 })
    this.farm = await TestFARM.new({ from: main2 })
    this.redeemer = await Redeemer.new(this.apToken.address, this.farm.address, { from: main3 })

    // setup token amounts
    this.initialAPSupply = new BN(web3.utils.toWei('8'))
    await this.apToken.directMint(user1, this.initialAPSupply, { from: main1 })

    this.initialRedeemerBalance = new BN(web3.utils.toWei('10000'))
    await this.farm.transfer(this.redeemer.address, this.initialRedeemerBalance, { from: main2 })
  })

  describe('test setup', () => {
    it('gives redeemer expected farm tokens', async () => {
      expect(await this.farm.balanceOf(this.redeemer.address)).to.be.bignumber.equal(
        this.initialRedeemerBalance
      )
    })
  })

  describe('token redemption', () => {
    it('cannot redeem without approval', async () => {
      const initialApprove = await this.apToken.allowance(user1, this.redeemer.address)
      expect(initialApprove).to.be.bignumber.equal(new BN('0'))

      await expectRevert(
        this.redeemer.redeem(web3.utils.toWei('5'), { from: user1 }),
        'ERC20: burn amount exceeds allowance'
      )
    })

    it('prevents user without ap tokens from redeeming', async () => {
      expect(await this.apToken.balanceOf(user2)).to.be.bignumber.equal(new BN('0'))

      await expectRevert(this.redeemer.redeem('0', { from: user2 }), 'Cannot redeem 0 tokens')
    })

    it('cannot redeem if no farm tokens are available', async () => {
      //redeploy new redeemer without farm balance
      this.redeemer = await Redeemer.new(this.apToken.address, this.farm.address, { from: main3 })

      expect(await this.farm.balanceOf(this.redeemer.address)).to.be.bignumber.equal(new BN('0'))

      await expectRevert(
        this.redeemer.redeem(web3.utils.toWei('5'), { from: user1 }),
        'worthless redeem'
      )
    })

    it('cannot redeem more AP tokens than owned', async () => {
      expectEvent(
        await this.apToken.approve(this.redeemer.address, MAX_UINT256, { from: user1 }),
        'Approval',
        {
          owner: user1,
          spender: this.redeemer.address,
          value: MAX_UINT256
        }
      )

      const redeemAmount = this.initialAPSupply.add(new BN(web3.utils.toWei('1')))
      await expectRevert(
        this.redeemer.redeem(redeemAmount, { from: user1 }),
        'ERC20: burn amount exceeds balance'
      )
    })

    it('allows user with AP tokens to redeem FARM tokens', async () => {
      await this.apToken.approve(this.redeemer.address, MAX_UINT256, { from: user1 })

      const burnRedeemAmount = new BN(web3.utils.toWei('5'))
      expect(burnRedeemAmount).to.be.bignumber.at.most(
        this.initialAPSupply,
        'To high redeem test amount'
      )

      const expectedRedeemAmount = burnRedeemAmount
        .mul(this.initialRedeemerBalance)
        .div(this.initialAPSupply)

      expect(await this.farm.balanceOf(user1)).to.be.bignumber.equal(new BN('0'))

      expectEvent(await this.redeemer.redeem(burnRedeemAmount, { from: user1 }), 'Redeemed', {
        redeemer: user1,
        apValue: burnRedeemAmount,
        farmValue: expectedRedeemAmount
      })

      expect(await this.farm.balanceOf(user1)).to.be.bignumber.equal(expectedRedeemAmount)
    })
  })
})
