// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/IAPToken.sol';

contract Redeemer {
    using SafeMath for uint256;

    IAPToken public apToken;
    IERC20 public farmToken;

    event Redeemed(
        address indexed redeemer,
        uint256 apValue,
        uint256 farmValue
    );

    constructor(address apTokenAddr, address farmTokenAddr) {
        apToken = IAPToken(apTokenAddr);
        farmToken = IERC20(farmTokenAddr);
    }

    function redeem(uint256 tokens) external {
        require(tokens > 0, 'Cannot redeem 0 tokens');

        uint256 availableFARM = farmToken.balanceOf(address(this));
        uint256 earnedFarm = tokens.mul(availableFARM).div(
            apToken.totalAllocatedSupply(),
            'no AP tokens exist'
        );

        require(earnedFarm > 0, 'worthless redeem');

        apToken.burnFrom(msg.sender, tokens);
        farmToken.transfer(msg.sender, earnedFarm);

        emit Redeemed(msg.sender, tokens, earnedFarm);
    }
}
