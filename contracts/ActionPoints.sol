// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Address.sol';

interface ApprovingOwner {
    function approvesMint(bytes calldata data) external returns (uint256);
}

contract ActionPoints is Ownable, ERC20Burnable {
    using Address for address;

    constructor(IERC20 farmToken_) ERC20('Farm Action Points', 'FAP') Ownable() {
        farmToken = farmToken_;
    }

    function mintWithOwnerData(bytes calldata data) external {
        require(owner().isContract(), 'Only a contract can mint');
        uint256 tokensToMint = ApprovingOwner(owner()).approvesMint(data);
        _mint(msg.sender, tokensToMint);
    }
}
