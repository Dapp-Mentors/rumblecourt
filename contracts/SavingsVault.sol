// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// SavingsVault.sol - Basic hello world smart contract for testing workflow
contract SavingsVault {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function setMessage(string memory _message) public {
        message = _message;
    }

    function getMessage() public view returns (string memory) {
        return message;
    }
}