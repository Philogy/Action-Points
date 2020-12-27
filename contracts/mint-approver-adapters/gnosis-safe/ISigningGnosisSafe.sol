// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

interface ISigningGnosisSafe {
    function isValidSignature(
        bytes calldata _data,
        bytes calldata _signature
    ) external view returns (bytes4);
}
