// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/access/Ownable.sol';
import './IApprovingOwner.sol';


abstract contract StandardAdapter is IApprovingOwner, Ownable {
    // first 8 bytes of keccak256('AP_APPROVE_MINT')
    bytes8 constant internal APPROVE_MINT_PREFIX = 0xfd8bc5ba1c7980fc;

    event HashUsed(
        uint256 indexed nonce,
        uint256 amount,
        address indexed recipient
    );

    constructor() Ownable() { }

    function messageToSign(
        uint256 nonce,
        uint256 amount,
        address recipient
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            APPROVE_MINT_PREFIX,
            nonce,
            amount,
            recipient
        ));
    }

    function getHashUsed(bytes32 msgHash) public view returns (bool wasUsed) {
        assembly {
            wasUsed := and(sload(msgHash), 1)
        }
    }

    function approvesMint(
        uint256 nonce,
        uint256 amount,
        address recipient,
        bytes calldata data
    ) external override returns (bool) {
        bytes32 messageHash = messageToSign(nonce, amount, recipient);

        require(!getHashUsed(messageHash), 'Hash already used');
        require(isValidMsgHash(messageHash, data), 'Hash failed to validate');

        // avoid mapping to save gas, since no other mappings are used overlap
        // impossible unless hashcollision is found
        assembly {
            sstore(messageHash, 1)
        }
        emit HashUsed(nonce, amount, recipient);

        return true;
    }

    function isValidMsgHash(bytes32 msgHash, bytes memory _data)
        public virtual view returns (bool);

    function proxyCallAny(address target, bytes calldata data) external onlyOwner {
        (bool success,) = target.call(data);
        require(success);
    }
}
