// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '../StandardAdapter.sol';
import './ISigningGnosisSafe.sol';

contract GnosisSafeAdapter is StandardAdapter {
    // bytes4(keccak256('isValidSignature(bytes,bytes)')
    bytes4 constant internal EIP1271_MAGIC_VALUE = 0x20c13b0b;

    function isValidMsgHash(bytes32 msgHash, bytes memory signatures)
        public override view returns (bool)
    {
        ISigningGnosisSafe safe = ISigningGnosisSafe(owner());

        bytes memory data = abi.encodePacked(msgHash);

        return safe.isValidSignature(data, signatures) == EIP1271_MAGIC_VALUE;
    }
}
