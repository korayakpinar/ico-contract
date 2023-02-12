// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {

  /*
  string memory name,
  string memory symbol,
  uint256 initialSupply
  */
  TokenFactory = await hre.ethers.getContractFactory("TestToken");
  token = await TokenFactory.deploy("Token", "TKN", ethers.BigNumber.from("1000000000000000000"));
  await token.deployed();

  /*
    IERC20 ownersToken, 
    ICOSettings memory ourIcoSettings, 
    VestingSchedule memory Vesting, 
    uint256 ConversionRate, 
    IERC20 AnotherERC20Token, 
    address[] memory Whitelist
  
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

    struct VestingSchedule {
        uint256 _cliffDuration; //in seconds
        uint256 _start;         //unix timestamp
        uint256 _duration;      //in seconds
    }

    struct forAnotherERC20Token {
        uint256 _conversionRate;
        IERC20 _anotherERC20Token;
    }
    */

  //Get one wallet address
  const [owner] = await ethers.getSigners();

  //Get the current time
  const now = Math.floor(Date.now() / 1000);

  const icoSettings = [1, ethers.BigNumber.from("1000000000000000000"), now + 60, now + 100, true, false, 0, 0];
  vesting = [20, now + 120, 40];

  console.log("_start: " + vesting[1] )
  console.log("_cliffDuration: " + vesting[0])
  console.log("_duration: " + vesting[2])

  CrowdsaleFactory = await hre.ethers.getContractFactory("ICO");
  crowdsale = await CrowdsaleFactory.deploy( 
    token.address, //token address 
    icoSettings,  //ico settings
    vesting, //vesting settings
    1, //conversion rate 
    token.address, //for another erc20 token
    [owner.address]
    );
  await crowdsale.deployed();

  console.log("Token deployed to:", token.address);
  console.log("Crowdsale deployed to:", crowdsale.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
