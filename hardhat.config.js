require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require('dotenv').config()



/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.16",
  gasReporter: {
    enabled: true,
    outputFile: 'gas-report.txt',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY, 
  }
};
