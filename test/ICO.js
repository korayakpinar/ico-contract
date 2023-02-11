
const { ethers } = require("hardhat");
const hre = require("hardhat");
const hnh = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");


// TODO: Add tests for the following:
// 1. Test that for withdraw function works




describe("General", function () {
  let owner,account;
  let icoContract;
  let ICOtokenContract;
  let AnotherERC20PaymentToken;
  let openingTime;
  let closingTime;
  
  describe("Deployment", function () {
/*
    this.beforeEach(async function () {
      [owner] = await ethers.getSigners();

      const TestTokenFactory = await ethers.getContractFactory("TestToken");
      AnotherERC20PaymentToken = await TestTokenFactory.deploy("AnotherToken", "ATKN", ethers.BigNumber.from("1000000000000000000"));
      await AnotherERC20PaymentToken.deployed();

      const now = Math.floor(Date.now() / 1000);
      const icoSettings = [1, ethers.BigNumber.from("1000000000000000000"), now + 60, now + 180, false, false, 0, 0];
      const vesting = [0, 0, 0];
      const ICOFactory = await ethers.getContractFactory("ICO");
      icoContract = await ICOFactory.deploy(ICOtokenContract.address, icoSettings, vesting, 1, AnotherERC20PaymentToken.address, [owner.address]);
      await icoContract.deployed();

      
      ICOtokenContract = await TestTokenFactory.deploy("Token", "TKN", ethers.BigNumber.from("1000000000000000000"));
      await ICOtokenContract.deployed();
      ICOtokenContract.transfer(icoContract.address, ethers.BigNumber.from("1000000000000000000"));
    });
*/
    
    it("Should deploy the Another ERC20 Payment Token Contract", async function () {
      [owner, account] = await ethers.getSigners();
      const TestTokenFactory = await ethers.getContractFactory("TestToken");
      AnotherERC20PaymentToken = await TestTokenFactory.deploy("AnotherToken", "ATKN", ethers.BigNumber.from("1000000000000000000"));
      await AnotherERC20PaymentToken.deployed();
      
    });

    it("Should deploy the Token Contract", async function () {
      const TestTokenFactory = await ethers.getContractFactory("TestToken");
      ICOtokenContract = await TestTokenFactory.deploy("Token", "TKN", ethers.BigNumber.from("1000000000000000000"));
      await ICOtokenContract.deployed();
      
    });

    it("Should deploy the ICO Contract", async function () {
      const now = Math.floor(Date.now() / 1000);
      openingTime = now + 60;
      closingTime = now + 100;
      const icoSettings = [1, ethers.BigNumber.from("1000000000000000000"), now + 60, now + 100, true, false, 0, 0];
      const vesting = [20, now + 120, 40];
      const ICOFactory = await ethers.getContractFactory("ICO");
      icoContract = await ICOFactory.deploy(ICOtokenContract.address, icoSettings, vesting, 1, AnotherERC20PaymentToken.address, [account.address]);
      await icoContract.deployed();
    });

    it("Should transfer the ICO tokens to the ICO contract", async function () {
      await ICOtokenContract.transfer(icoContract.address, ethers.BigNumber.from("1000000000000000000"));
      await ICOtokenContract.balanceOf(icoContract.address).then((balance) => {
        expect(balance).to.equal(ethers.BigNumber.from("1000000000000000000"));
      });
      await AnotherERC20PaymentToken.transfer(account.address, ethers.BigNumber.from("1000000000000000000"));
      await AnotherERC20PaymentToken.balanceOf(account.address).then((balance) => {
        expect(balance).to.equal(ethers.BigNumber.from("1000000000000000000"));
      });
    });
  });

  describe("Getter Functions", function () {

    it("Should return the correct ICO token address", async function () {
      await icoContract.token().then((tokenAddress) => {
        expect(tokenAddress).to.equal(ICOtokenContract.address);
      });
    });

    it("Should return the correct payment token address", async function () {
      await icoContract.anotherERC20PaymentToken().then((tokenAddress) => {
        expect(tokenAddress).to.equal(AnotherERC20PaymentToken.address);
      });
    });

    it("Should return the raised wei", async function () {
      await icoContract.weiRaised().then((raisedWei) => {
        expect(raisedWei).to.equal(0);
      });
    });

    it("Should return the rate", async function () {
      await icoContract.rate().then((rate) => {
        expect(rate).to.equal(1);
      });
    });

    it("Should return the correct total supply", async function () {
      await icoContract.totalSupply().then((totalSupply) => {
        expect(totalSupply).to.equal(ethers.BigNumber.from("1000000000000000000"));
      });
    });

    it("Should return the correct opening time", async function () {
      await icoContract.openingTime().then((_openingTime) => {
        expect(_openingTime).to.equal(openingTime);
      });
    });

    it("Should return the correct closing time", async function () {
      await icoContract.closingTime().then((_closingTime) => {
        expect(_closingTime).to.equal(closingTime);
      });
    });
    
    it("Should return the correct individual cap", async function () {
      await icoContract.getCap(account.address).then((individualCap) => {
        expect(individualCap).to.equal(0);
      });
    });

    it("Should return the correct individual contribution", async function () {
      await icoContract.getContribution(account.address).then((individualContribution) => {
        expect(individualContribution).to.equal(0);
      });
    });

    it("Should return the correct private sale state", async function () {
      await icoContract.isPrivateSale().then((privateSale) => {
        expect(privateSale).to.equal(true);
      });
    });

    it("Should return the correct whitelisted state", async function () {
      await icoContract.isWhitelisted(account.address).then((whitelisted) => {
        expect(whitelisted).to.equal(true);
      });
      await icoContract.isWhitelisted(owner.address).then((whitelisted) => {
        expect(whitelisted).to.equal(false);
      });
    });

    it("Should return the correct output for the isOpen function", async function () {
      await icoContract.isOpen().then((isOpen) => {
        expect(isOpen).to.equal(false);
      });
    });


  });

  describe("onlyWhileOpen", function () {
    it("buyTokens should fail if the ICO is closed", async function () {
      await expect(icoContract.connect(account).buyTokens(account.address,{ value: ethers.BigNumber.from("1000000000000000000") })).to.be.revertedWith("ICO is not open");
    });

    it("buyTokensWithAnotherERC20Token should fail if the ICO is closed", async function () {
      await expect(icoContract.connect(account).buyTokensWithAnotherERC20Token(account.address,ethers.BigNumber.from("1000000000000000000"))).to.be.revertedWith("ICO is not open");
    });
  });

  describe("Withdrawals", function () {
    it("Should fail if the ICO is not closed - withdraw", async function () {
      await expect(icoContract.withdraw()).to.be.revertedWith("ICO is not closed");
    });

  });

  describe("Ownership test and Owner functions", function () {
    

    it("Should fail if the caller is not the owner - startPublicSale", async function () {
      await expect(icoContract.connect(account).startPublicSale()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail if the caller is not the owner - removeFromWhitelist/addToWhitelist", async function () {
      await icoContract.isWhitelisted(account.address).then((whitelisted) => {
        expect(whitelisted).to.equal(true);
      });
      await expect(icoContract.connect(account).removeFromWhitelist(account.address)).to.be.revertedWith("Ownable: caller is not the owner");
      await icoContract.isWhitelisted(account.address).then((whitelisted) => {
        expect(whitelisted).to.equal(true);
      });
      await icoContract.connect(owner).removeFromWhitelist(account.address);
      await icoContract.isWhitelisted(account.address).then((whitelisted) => {
        expect(whitelisted).to.equal(false);
      });

      await icoContract.connect(owner).addToWhitelist(account.address);
      await icoContract.isWhitelisted(account.address).then((whitelisted) => {
        expect(whitelisted).to.equal(true);
      });
    });

    it("Should fail if the caller is not the owner - setCap/getCap", async function () {
      await expect(icoContract.connect(account).setCap(account.address,ethers.BigNumber.from("1000000000000000000"))).to.be.revertedWith("Ownable: caller is not the owner");
      await icoContract.getCap(account.address).then((individualCap) => {
        expect(individualCap).to.equal(0);
      });

      await icoContract.connect(owner).setCap(account.address,ethers.BigNumber.from("1000000"));
      await icoContract.getCap(account.address).then((individualCap) => {
        expect(individualCap).to.equal(ethers.BigNumber.from("1000000"));
      });
    });

    it("Should start the public sale", async function () {

      await icoContract.isPrivateSale().then((privateSale) => {
        expect(privateSale).to.equal(true);
      });
      hnh.time.setNextBlockTimestamp(openingTime+2);
      await icoContract.connect(owner).startPublicSale();
      await icoContract.isPrivateSale().then((privateSale) => {
        expect(privateSale).to.equal(false);
      });
  
    });

    it("Should fail if the caller is not the owner - withdraw", async function () {
      await expect(icoContract.connect(account).withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Buy tokens", function () {
    it("Should fail if the caller's contribution exceeds individual cap", async function () {
      await expect(icoContract.connect(account).buyTokens(account.address,{ value: ethers.BigNumber.from("1000000000000000000") })).to.be.revertedWith("Contribution exceeds cap");
    });

    it("Should works if the caller's contribution does not exceed individual cap", async function () {
      await icoContract.connect(account).buyTokens(account.address,{ value: ethers.BigNumber.from("500000") });
      await icoContract.getContribution(account.address).then((individualContribution) => {
        expect(individualContribution).to.equal(ethers.BigNumber.from("500000"));
      });
    });

    it("Should work with another ERC20 token", async function () {
      await icoContract.connect(account).buyTokensWithAnotherERC20Token(account.address,ethers.BigNumber.from("500000"));
      await icoContract.getContribution(account.address).then((individualContribution) => {
        expect(individualContribution).to.equal(ethers.BigNumber.from("1000000"));
      });
    });

  })

  describe("Withdraw", function () {

    it("Withdraw should work", async function () {
      hnh.time.setNextBlockTimestamp(closingTime+2);
      await icoContract.connect(owner).withdraw();
      await icoContract.getContribution(account.address).then((individualContribution) => {
        expect(individualContribution).to.equal(1000000);
      });
    });
  });

  
});

