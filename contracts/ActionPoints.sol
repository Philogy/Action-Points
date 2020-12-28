// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import './mint-approver-adapters/IApprovingOwner.sol';
import './interfaces/IAPToken.sol';

contract ActionPoints is Ownable, IAPToken, ERC20Burnable {
    using Address for address;
    using SafeMath for uint256;

    uint256 public allocatedTokens;

    event APTokensAllocated(uint256 currentlyAllocated);

    constructor() ERC20('Farm Action Points', 'FAP') Ownable() { }

    function allocateCoins(uint256 apTokenAmount) external onlyOwner {
        _setAPTokenAllocation(allocatedTokens.add(apTokenAmount));
    }

    function _setAPTokenAllocation(uint256 tokens) internal {
        allocatedTokens = tokens;
        emit APTokensAllocated(tokens);
    }

    function totalAllocatedSupply() external override view returns (uint256) {
        return totalSupply().add(allocatedTokens);
    }

    function mintWithOwnerData(
        uint256 nonce,
        uint256 amount,
        bytes calldata data
    ) external {
        require(owner().isContract(), 'Only contract can verify mint');
        require(amount <= allocatedTokens, 'Insufficient tokens allocated');

        IApprovingOwner apOwner = IApprovingOwner(owner());
        require(apOwner.approvesMint(nonce, amount, msg.sender, data), 'Mint denied');

        _mint(msg.sender, amount);
        // safemath.sub is not used here to save gas since a require already
        // verifies that there will be no overflow
        _setAPTokenAllocation(allocatedTokens - amount);
    }

    function directMint(address recipient, uint256 amount) external onlyOwner {
        _mint(recipient, amount);
    }

    function burn(uint256 amount) public override(ERC20Burnable, IAPToken) {
        ERC20Burnable.burn(amount);
    }

    function burnFrom(address account, uint256 amount)
        public
        override(ERC20Burnable, IAPToken)
    {
        ERC20Burnable.burnFrom(account, amount);
    }
}
