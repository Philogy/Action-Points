const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

const ActionPoints = artifacts.require('ActionPoints')

contract('ActionPoints', ([main1, user1, user2, adversary1, adversary2]) => {
  beforeEach(async () => {
    this.apToken = await ActionPoints.new({ from: main1 })
  })

  describe('deploy conditions', () => {
    it('has correct owner', async () => {
      expect(await this.apToken.owner()).to.equal(main1, 'wrong owner')
    })
    it('has no initial supply', async () => {
      expect(await this.apToken.totalSupply()).to.be.bignumber.equal(new BN('0'))
    })
  })

  describe('minting', () => {
    it('allows owner to directly mint', async () => {
      const user1BalBefore = await this.apToken.balanceOf(user1)

      expect(user1BalBefore).to.be.bignumber.equal(new BN('0'), 'initial balance should be zero')

      const mintAmount = web3.utils.toWei('5.4')
      expectEvent(await this.apToken.directMint(user1, mintAmount, { from: main1 }), 'Transfer', {
        from: '0x'.concat('00'.repeat(20)),
        to: user1,
        value: mintAmount
      })

      const user1BalAfter = await this.apToken.balanceOf(user1)

      expect(user1BalAfter.sub(user1BalBefore)).to.be.bignumber.equal(
        mintAmount,
        'Wrong amount received'
      )
    })

    it('prevents non-owners from minting', async () => {
      expect(await this.apToken.owner()).to.not.equal(adversary1, 'Wrong starting owner')

      const mintAmount = web3.utils.toWei('1000')
      await expectRevert(
        this.apToken.directMint(adversary2, mintAmount, { from: adversary1 }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('basic token functions', () => {
    it('can transfer', async () => {
      const mintAmount = web3.utils.toWei('8')
      await this.apToken.directMint(user1, mintAmount, { from: main1 })

      const user1BalBefore = await this.apToken.balanceOf(user1)
      const user2BalBefore = await this.apToken.balanceOf(user2)

      const amountToSend = web3.utils.toWei('5')

      expectEvent(await this.apToken.transfer(user2, amountToSend, { from: user1 }), 'Transfer', {
        from: user1,
        to: user2,
        value: amountToSend
      })

      const user1BalAfter = await this.apToken.balanceOf(user1)
      const user2BalAfter = await this.apToken.balanceOf(user2)

      expect(user1BalBefore.sub(user1BalAfter)).to.be.bignumber.equal(
        amountToSend,
        'invalid amount deducted'
      )
      expect(user2BalAfter.sub(user2BalBefore)).to.be.bignumber.equal(
        amountToSend,
        'invalid amount received'
      )
    })
  })
})
