// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BbwlToken is ERC20, Ownable {

    constructor() ERC20("BbwlToken", "BBWL") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _transferOwnership(address newOwner) public onlyOwner {
        transferOwnership(newOwner);
    }
}