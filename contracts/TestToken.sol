// contracts/SimpleToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract TestToken is ERC20 {
    
    constructor(
        string memory ourName,
        string memory ourSymbol,
        uint256 initialSupply
    ) public ERC20(ourName, ourSymbol) {
        _mint(msg.sender, initialSupply);
    }
}