// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

contract Redemption {
    using SafeMath for uint256;

    IERC20 public apToken;
    IERC20 public farmToken;

    constructor(IERC20 apToken_, IERC20 farmToken_) {
        apToken = apToken_;
        farmToken = farmToken_;
    }


    function redeem(uint256 tokens) external {
        require(tokens > 0, 'Cannot redeem 0 tokens');

        uint256 availableFarm = farmToken.balanceOf(address(this));
        uint256 earnedFarm = tokens.mul(availableFarm).div(apToken.totalSupply());

        apToken.burnFrom(msg.sender, tokens);
        farmToken.transfer(msg.sender, earnedFarm);
    }
}
