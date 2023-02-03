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
  address payable wallet, 
  IERC20 token, 
  uint256 rate, 
  uint256 totalSupply, 
  uint256 openingTime, 
  uint256 closingTime, 
  bool isPrivateSale
  */

  //Get one wallet address
  const [owner] = await ethers.getSigners();

  //Get the current time
  const now = Math.floor(Date.now() / 1000);

  CrowdsaleFactory = await hre.ethers.getContractFactory("ICO");
  crowdsale = await CrowdsaleFactory.deploy(owner.address, token.address, 1, ethers.BigNumber.from("1000000000000000000"), now + 60, now + 180, false);
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
