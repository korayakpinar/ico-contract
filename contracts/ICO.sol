// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//import "hardhat/console.sol";

contract ICO {

    //TODO: Add another ERC20 token to be used as a payment method
    //TODO: Add individual cap for each address
    //TODO: Add a function to add to and remove from whitelist    
    //TODO: Add a linear vesting schedule for the token

    //Opening and closing time for the ICO
    uint256 private _openingTime;
    uint256 private _closingTime;

    //Is the ICO a private sale
    bool private _isPrivateSale;

    //Whitelist of addresses
    address[] private _whitelist;    

    // The token being sold
    IERC20 private _token;

    // Address where funds are collected
    address payable private _wallet;

    // Amount of wei raised
    uint256 private _weiRaised;

    // Rate of token
    uint256 private _rate;

    // Total supply of token
    uint256 private _totalSupply;

    modifier onlyWhileOpen {
        require(block.timestamp >= _openingTime && block.timestamp <= _closingTime, "ICO is not open");
        _;
    }

    constructor (address payable wallet, IERC20 token, uint256 rate, uint256 totalSupply, uint256 openingTime, uint256 closingTime, bool isPrivateSale) {
        require(rate > 0, "Rate is 0");
        require(wallet != address(0), "Wallet is the zero address");
        require(address(token) != address(0), "Token is the zero address");
        require(openingTime >= block.timestamp);
        require(closingTime > openingTime);



        _wallet = wallet;
        _token = token;
        _rate = rate;
        _totalSupply = totalSupply;
        _openingTime = openingTime;
        _closingTime = closingTime;
        _isPrivateSale = isPrivateSale;
    }

    function wallet() public view returns (address) {
        return _wallet;
    }
    
    function token() public view returns (IERC20) {
        return _token;
    }
    
    function weiRaised() public view returns (uint256) {
        return _weiRaised;
    }

    function rate() public view returns(uint256) {
        return _rate;
    }
    
    function totalSupply() public view returns(uint256) {
        return _totalSupply;
    }

    function openingTime() public view returns (uint256) {
        return _openingTime;
    }

    function closingTime() public view returns (uint256) {
        return _closingTime;
    }

    function isPrivateSale() public view returns (bool) {
        return _isPrivateSale;
    }

    function isWhitelisted(address account) public view returns (bool) {
        for (uint i = 0; i < _whitelist.length; i++) {
            if (_whitelist[i] == account) {
                return true;
            }
        }
        return false;
    }

    function buyTokens(address beneficiary) public payable onlyWhileOpen {
        if (_isPrivateSale) {
            require(isWhitelisted(beneficiary), "Address is not whitelisted");
        }
        
        uint256 weiAmount = msg.value;
        _preValidatePurchase(beneficiary, weiAmount);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount);

        // update state
        _weiRaised += weiAmount;

        _processPurchase(beneficiary, tokens);
        

        

        _forwardFunds();
       
    }

    function _processPurchase(address beneficiary, uint256 tokenAmount) internal {
        SafeERC20.safeTransfer(_token, beneficiary, tokenAmount);
    }

    function _preValidatePurchase(address beneficiary, uint256 weiAmount) internal view {
        require(beneficiary != address(0), "Beneficiary is the zero address");
        require(weiAmount != 0, "WeiAmount is 0");
        require(_weiRaised + weiAmount > _totalSupply, "Total supply is exceeded");
    }

    function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
        return weiAmount * _rate;
    }

    function _forwardFunds() internal {
        _wallet.transfer(msg.value);
    }

    function isOpen() public view returns (bool) {
        return block.timestamp >= _openingTime && block.timestamp <= _closingTime;
    }

    function startPublicSale() public {
        require(_isPrivateSale, "ICO is not private");
        require(block.timestamp >= _openingTime, "ICO is not open");
        _isPrivateSale = false;
    }

}
