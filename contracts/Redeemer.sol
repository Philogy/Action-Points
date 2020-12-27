// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './IERC20Burnable.sol';

contract Redeemer {
    using SafeMath for uint256;

    IERC20Burnable public apToken;
    IERC20 public farmToken;

    constructor(address apTokenAddr, address farmTokenAddr) {
        apToken = IERC20Burnable(apTokenAddr);
        farmToken = IERC20(farmTokenAddr);
    }

    function redeem(uint256 tokens) external {
        require(tokens > 0, 'Cannot redeem 0 tokens');

        uint256 availableFARM = farmToken.balanceOf(address(this));
        uint256 earnedFarm = tokens.mul(availableFARM).div(apToken.totalSupply());

        apToken.burnFrom(msg.sender, tokens);
        farmToken.transfer(msg.sender, earnedFarm);
    }
}
