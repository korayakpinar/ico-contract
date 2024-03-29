// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


//TODO Add events
//TODO Change redeem functions from the ether to the token

contract ICO is ReentrancyGuard, Ownable {

    //Conversion rate for the another ERC20 token
    struct ForAnotherERC20Token {
        uint256 _conversionRate;
        IERC20 _anotherERC20Token;
    }
    ForAnotherERC20Token private _forAnotherERC20Token;

    //Vesting schedule for the token
    struct VestingSchedule {
        uint256 _cliffDuration; //in seconds
        uint256 _start;         //unix timestamp
        uint256 _duration;      //in seconds
    }
    VestingSchedule private _vestingSchedule;

    //ICO Settings
    struct ICOSettings {
        uint256 _rate;
        uint256 _totalSupply;
        uint256 _openingTime;
        uint256 _closingTime;
        bool _isPrivateSale;
        bool _capsIsOpen;
        uint256 _minCap;
        uint256 _maxCap;
    }
    ICOSettings private _icoSettings;
    
    // Amount of wei raised
    uint256 private _weiRaised;

    // The token being sold
    IERC20 immutable private _token;

    //Whitelist of addresses
    mapping(address => bool) private _whitelist; 

    //Individual contributions and capping
    mapping(address => uint256) private _contributions;

    //Releasable amounts for the vesting schedule
    mapping(address => uint256) private _releasableAmounts;

    //Caps for the individual contributions
    mapping(address => uint256) private _caps;

    modifier onlyWhileOpen {
        require(block.timestamp >= _icoSettings._openingTime && block.timestamp <= _icoSettings._closingTime, "ICO is not open");
        _;
    }

    constructor (
    IERC20 ownersToken, 
    ICOSettings memory ourIcoSettings, 
    VestingSchedule memory Vesting, 
    uint256 ConversionRate, 
    IERC20 AnotherERC20Token, 
    address[] memory Whitelist
    ) {
        require(ourIcoSettings._rate > 0, "Rate is 0");
        require(address(ownersToken) != address(0), "Token is the zero address");
        require(ourIcoSettings._openingTime >= block.timestamp);
        require(ourIcoSettings._closingTime > ourIcoSettings._openingTime);

        if(ourIcoSettings._capsIsOpen == true) {    //optional
            require(ourIcoSettings._minCap > 0, "MinCap is 0");
            require(ourIcoSettings._maxCap > 0, "MaxCap is 0");
            require(ourIcoSettings._minCap < ourIcoSettings._maxCap, "MinCap is greater than MaxCap");
        }
        
        require(ourIcoSettings._totalSupply > 0, "TotalSupply is 0");
        require(ourIcoSettings._totalSupply > ourIcoSettings._minCap, "TotalSupply is less than MinCap");

        for (uint i = 0; i < Whitelist.length; i++) {
            _whitelist[Whitelist[i]] = true;
        }

        _token = ownersToken;
        _icoSettings. _rate = ourIcoSettings._rate;
        _icoSettings._totalSupply = ourIcoSettings._totalSupply;
        _icoSettings. _openingTime = ourIcoSettings._openingTime;
        _icoSettings._closingTime = ourIcoSettings._closingTime;
        _icoSettings._isPrivateSale = ourIcoSettings._isPrivateSale;
        _icoSettings._capsIsOpen = ourIcoSettings._capsIsOpen;
        _icoSettings._minCap = ourIcoSettings._minCap;
        _icoSettings._maxCap = ourIcoSettings._maxCap;
        _vestingSchedule._cliffDuration = Vesting._cliffDuration;
        _vestingSchedule._start = Vesting._start;
        _vestingSchedule._duration = Vesting._duration;
        _forAnotherERC20Token._conversionRate = ConversionRate;
        _forAnotherERC20Token._anotherERC20Token = AnotherERC20Token;
        

    }


    // -----------------------------------------
    //              View functions
    // -----------------------------------------

    
    function token() public view returns (IERC20) {
        return _token;
    }

    function anotherERC20PaymentToken() public view returns (IERC20) {
        return _forAnotherERC20Token._anotherERC20Token;
    }
    
    function weiRaised() public view returns (uint256) {
        return _weiRaised;
    }

    function rate() public view returns(uint256) {
        return _icoSettings._rate;
    }
    
    function totalSupply() public view returns(uint256) {
        return _icoSettings._totalSupply;
    }

    function openingTime() public view returns (uint256) {
        return _icoSettings._openingTime;
    }

    function closingTime() public view returns (uint256) {
        return _icoSettings._closingTime;
    }
    
    function getCap(address account) public view returns (uint256) {
        return _caps[account];
    }

    function getContribution(address account) public view returns (uint256) {
        return _contributions[account];
    }

    function isPrivateSale() public view returns (bool) {
        return _icoSettings._isPrivateSale;
    }

    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account]; 
    }

    //  linear vesting schedule
    //  contributions x rate x percentage | releasable amount -> redeemable amount
    //  percentage -> (block.timestamp() - (_start + _cliffDuration)) / duration - _cliffDuration
    function _getRedeemableAmount() private view returns (uint256 redeemableAmount) {
        require(block.timestamp> _vestingSchedule._start + _vestingSchedule._cliffDuration, "Vesting is not started");
        require(_contributions[msg.sender] > 0, "Address has no contribution");
        
        if(block.timestamp < _vestingSchedule._start + _vestingSchedule._cliffDuration) {
            return 0;
        } else if(block.timestamp >= _vestingSchedule._start + _vestingSchedule._duration) {
            return _contributions[msg.sender] * _icoSettings._rate;
        } else if(block.timestamp >= _vestingSchedule._start + _vestingSchedule._cliffDuration){
            return _contributions[msg.sender] * _icoSettings._rate * (block.timestamp - (_vestingSchedule._start + _vestingSchedule._cliffDuration)) / ( _vestingSchedule._duration - _vestingSchedule._cliffDuration);
        }
        
    }

    function _preValidatePurchase(address beneficiary, uint256 weiAmount) internal view {
        require(beneficiary != address(0), "Beneficiary is the zero address");
        require(weiAmount != 0, "WeiAmount is 0");

        if(_caps[beneficiary] == 0 && _icoSettings._capsIsOpen == true) {
           require(_icoSettings._minCap < weiAmount, "Contribution is not within the cap");
           require(_icoSettings._maxCap > weiAmount, "Contribution is not within the cap");
        } else{
            require(_contributions[beneficiary] + weiAmount <= _caps[beneficiary], "Contribution exceeds cap");
        }
        
        require(_weiRaised + weiAmount < _icoSettings._totalSupply, "Total supply is exceeded");
    }

    function isOpen() public view returns (bool) {
        return block.timestamp >= _icoSettings._openingTime && block.timestamp <= _icoSettings._closingTime;
    }


    // -----------------------------------------
    //            External functions
    // -----------------------------------------



    function buyTokens(address beneficiary) public payable onlyWhileOpen nonReentrant {
        if (_icoSettings._isPrivateSale) {
            require(isWhitelisted(beneficiary), "Address is not whitelisted");
        }
        
        uint256 weiAmount = msg.value;
        _preValidatePurchase(beneficiary, weiAmount);

        // update state
        _weiRaised += weiAmount;

        _contributions[beneficiary] = _contributions[beneficiary] + weiAmount;
        _releasableAmounts[beneficiary] = _releasableAmounts[beneficiary] + weiAmount;
        
       
    }

    function buyTokensWithAnotherERC20Token(address beneficiary, uint256 amount) public onlyWhileOpen nonReentrant {
        if (_icoSettings._isPrivateSale) {
            require(isWhitelisted(beneficiary), "Address is not whitelisted");
        }
        
        uint256 weiAmount = amount * _forAnotherERC20Token._conversionRate;
        _preValidatePurchase(beneficiary, weiAmount);

        // update state
        _weiRaised += weiAmount;
        
        _contributions[beneficiary] = _contributions[beneficiary] + weiAmount;
        _releasableAmounts[beneficiary] = _releasableAmounts[beneficiary] + weiAmount;
        
    }

    function startPublicSale() public onlyOwner {
        require(_icoSettings._isPrivateSale, "ICO is not private");
        require(block.timestamp >= _icoSettings._openingTime, "ICO is not open");
        _icoSettings._isPrivateSale = false;
    }

    function addToWhitelist(address account) public onlyOwner {
        require(_icoSettings._isPrivateSale, "ICO is not private");          // optional
        require(block.timestamp < _icoSettings._openingTime, "ICO is open"); // optional
        require(!isWhitelisted(account), "Address is already whitelisted");
        _whitelist[account] = true;
    }

    function removeFromWhitelist(address account) public onlyOwner {
        require(_icoSettings._isPrivateSale, "ICO is not private");          // optional
        require(block.timestamp < _icoSettings._openingTime, "ICO is open"); // optional
        require(isWhitelisted(account), "Address is not whitelisted");
        _whitelist[account] = false;
    }

    function setCap(address account, uint256 cap) public onlyOwner {
        require(_icoSettings._isPrivateSale, "ICO is not private");          // optional
        require(block.timestamp < _icoSettings._openingTime, "ICO is open"); // optional
        require(isWhitelisted(account), "Address is not whitelisted");
        _caps[account] = cap;
    }

    function withdraw() public onlyOwner {
        require(block.timestamp > _icoSettings._closingTime, "ICO is not closed");
        uint256 balance = _token.balanceOf(address(this));
        SafeERC20.safeTransfer(_token, owner(), balance);
    }

    receive() external payable {
        getContribution(msg.sender);
    }

    //This function will be deleted probably
    function redeemInERC20(address payable _to) public nonReentrant {
        require(_to != address(0), "Address is the zero address");
        require(block.timestamp > _vestingSchedule._start + _vestingSchedule._cliffDuration, "Vesting is in cliff duration or not started");
        require(_contributions[msg.sender] > 0, "Address has no contribution");

        uint256 redeemableAmount = _getRedeemableAmount() > _releasableAmounts[msg.sender] ? _releasableAmounts[msg.sender] * _forAnotherERC20Token._conversionRate : _getRedeemableAmount() * _forAnotherERC20Token._conversionRate;

        require(redeemableAmount > 0, "Redeemable amount is 0");
        SafeERC20.safeTransfer(_token, _to, redeemableAmount);

        _releasableAmounts[msg.sender] = _releasableAmounts[msg.sender] - redeemableAmount;
    }

    //This function will change to redeemInICOToken
    function redeemInEther(address payable _to) public nonReentrant {
        require(_to != address(0), "Address is the zero address");
        require(block.timestamp > _vestingSchedule._start + _vestingSchedule._cliffDuration, "Vesting is in cliff duration or not started");
        require(_contributions[msg.sender] > 0, "Address has no contribution");
        uint256 redeemableAmount = _getRedeemableAmount( ) > _releasableAmounts[msg.sender] ? _releasableAmounts[msg.sender] : _getRedeemableAmount();
        require(redeemableAmount > 0, "Redeemable amount is 0");
        
        (bool sent,  ) = _to.call{value: redeemableAmount}("");
        require(sent == true, "Failed to send Ether");

        _releasableAmounts[msg.sender] = _releasableAmounts[msg.sender] - redeemableAmount;
    }

}
