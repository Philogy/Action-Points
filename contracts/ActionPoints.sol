// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import './mint-approver-adapters/IApprovingOwner.sol';

contract ActionPoints is Ownable, ERC20Burnable {
    using Address for address;

    constructor() ERC20('Farm Action Points', 'FAP') Ownable() { }

    function mintWithOwnerData(
        uint256 nonce,
        uint256 amount,
        bytes calldata data
    ) external {
        require(owner().isContract(), 'Only contract can verify mint');

        IApprovingOwner apOwner = IApprovingOwner(owner());
        require(apOwner.approvesMint(nonce, amount, msg.sender, data), 'Mint denied');
        _mint(msg.sender, amount);
    }

    function directMint(address recipient, uint256 amount) external onlyOwner {
        _mint(recipient, amount);
    }
}
