// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

// Interface for Action Points
interface IApprovingOwner {
    function approvesMint(
        uint256 nonce,
        uint256 amount,
        address recipient,
        bytes calldata data
    ) external returns (bool);
}
