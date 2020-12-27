// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TestFARM is ERC20 {
    constructor() ERC20('Test farm token', 'tFARM') {
        _mint(msg.sender, 500000 ether); // 500 000 tokens
    }
}
