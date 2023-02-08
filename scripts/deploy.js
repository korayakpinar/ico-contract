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
  address payable ownerWallet, 
  IERC20 ownersToken, 
  uint256 Rate, 
  uint256 TotalSupply, 
  uint256 OpeningTime, 
  uint256 ClosingTime, 
  bool IsPrivateSale, 
  bool CapsIsOpen, 
  uint256 MinCap, 
  uint256 MaxCap, 
  uint256 Cliff, 
  uint256 Start, 
  uint256 Duration, 
  uint256 ConversionRate, 
  IERC20 AnotherERC20Token, 
  address[] memory Whitelist
  */

  //Get one wallet address
  const [owner] = await ethers.getSigners();

  //Get the current time
  const now = Math.floor(Date.now() / 1000);

  CrowdsaleFactory = await hre.ethers.getContractFactory("ICO");
  crowdsale = await CrowdsaleFactory.deploy(owner.address, token.address, 1, ethers.BigNumber.from("1000000000000000000"), now + 60, now + 180, false, false, 0, 0, 0, 0, 0, 0, token.address, [owner.address]);
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
