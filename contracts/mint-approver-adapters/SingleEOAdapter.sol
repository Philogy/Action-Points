// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import './IApprovingOwner.sol';


contract SingleEOAAdapter is IApprovingOwner, Ownable {
    // first 8 bytes of keccak256('AP_APPROVE_MINT')
    bytes8 constant internal APPROVE_MINT_PREFIX = 0xfd8bc5ba1c7980fc;

    mapping(address => mapping(uint256 => bool)) public noncesUsed;

    constructor() Ownable() { }

    function messageToSign(
        uint256 nonce,
        uint256 amount,
        address recipient
    ) public pure returns (bytes32) {
        return ECDSA.toEthSignedMessageHash(
            keccak256(abi.encodePacked(
                APPROVE_MINT_PREFIX,
                nonce,
                amount,
                recipient
            ))
        );
    }

    function approvesMint(
        uint256 nonce,
        uint256 amount,
        address recipient,
        bytes calldata signature
    ) external override returns (bool) {
        require(!noncesUsed[recipient][nonce], 'Attempting to reuse nonce');

        bytes32 hashToSign = messageToSign(nonce, amount, recipient);
        bool signatureMatches = (ECDSA.recover(hashToSign, signature) == owner());

        if (signatureMatches) {
            noncesUsed[recipient][nonce] = true;
        }

        return signatureMatches;
    }

    function proxyCallAny(address target, bytes calldata data) external onlyOwner {
        (bool success,) = target.call(data);
        require(success);
    }
}
