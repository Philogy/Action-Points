// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import './StandardAdapter.sol';

contract SingleEOAAdapter is StandardAdapter {
    function isValidMsgHash(bytes32 msgHash, bytes memory signature)
        public override view returns (bool)
    {
        bytes32 possiblySignedHash = ECDSA.toEthSignedMessageHash(msgHash);
        return ECDSA.recover(possiblySignedHash, signature) == owner();
    }
}
