const { expect } = require("chai");
const { increaseTime } = require('./helpers/increaseTime')

describe("BasicLoan", async function() {
  let DAI, BasicLoan, dai, basicLoan, owner, acccount2;
  beforeEach(async() => {
    [owner, acccount2] = await hre.ethers.getSigners();
    
    DAI = await hre.ethers.getContractFactory("DAI");
    dai = await DAI.deploy();
    await dai.deployed();

    BasicLoan = await hre.ethers.getContractFactory("BasicLoan");
    basicLoan = await BasicLoan.deploy(dai.address);
    await basicLoan.deployed(dai.address);
  });
  
  it("Deployment should assign the total supply of tokens to the owner", async function() {
    const ownerDaiBalance = await dai.balanceOf(owner.address);
    expect(await dai.totalSupply()).to.equal(ownerDaiBalance);
  });

  it("should setTerms", async function() {
    let block = await ethers.provider.getBlock();
    await basicLoan.setTerms(100, 5, ethers.utils.parseEther("1"), block.timestamp + 120);
    const terms = await basicLoan.terms();
    expect(terms.loanDaiAmount).to.equal(100);
    expect(terms.feeDaiAmount).to.equal(5);
    expect(terms.ethCollateralAmount).to.equal(ethers.utils.parseEther("1"));
    expect(terms.repayByTimeStamp.toNumber()).to.greaterThan(block.timestamp);
  });

  it("should fund loan", async function() {
    let block = await ethers.provider.getBlock();
    await basicLoan.setTerms(100, 5, ethers.utils.parseEther("1"), block.timestamp + 120);
    const terms = await basicLoan.terms();
    const beforeOwnerDaiBalance = await dai.balanceOf(owner.address);
    await dai.approve(basicLoan.address, terms.loanDaiAmount);
    await basicLoan.fundLoan();
    const ownerDaiBalance = await dai.balanceOf(owner.address);
    expect(ownerDaiBalance).to.equal(beforeOwnerDaiBalance - terms.loanDaiAmount);
  });

  it("should take loan and accept loan terms", async function() {
    let block = await ethers.provider.getBlock();
    await basicLoan.setTerms(100, 5, ethers.utils.parseEther("1"), block.timestamp + 120);
    const terms = await basicLoan.terms();
    await dai.approve(basicLoan.address, terms.loanDaiAmount);
    await basicLoan.fundLoan();
    await basicLoan.connect(acccount2).takeALoanAndAcceptLoanTerms({ value: ethers.utils.parseEther("1") });
    const borrowerDaiBalance = await dai.balanceOf(acccount2.address);
    expect(borrowerDaiBalance).to.equal(terms.loanDaiAmount);
  });

  it("should repay loan", async function() {
    let block = await ethers.provider.getBlock();
    await basicLoan.setTerms(100, 5, ethers.utils.parseEther("1"), block.timestamp + 100);
    const terms = await basicLoan.terms();
    await dai.approve(basicLoan.address, terms.loanDaiAmount);
    await basicLoan.fundLoan();
    await basicLoan.connect(acccount2).takeALoanAndAcceptLoanTerms({ value: ethers.utils.parseEther("1") });
    const borrowerDaiBalance = await dai.balanceOf(acccount2.address);
    expect(borrowerDaiBalance).to.equal(terms.loanDaiAmount);
    await dai.transfer(acccount2.address, 5);
    await dai.connect(acccount2).approve(basicLoan.address, terms.loanDaiAmount + terms.feeDaiAmount);
    const beforeOwnerDaiBalance = await dai.balanceOf(owner.address);
    await increaseTime(125);
    await basicLoan.connect(acccount2).repay();
    const afterOwnerDaiBalance = await dai.balanceOf(owner.address);
    expect(afterOwnerDaiBalance).to.equal(beforeOwnerDaiBalance.toNumber() + terms.loanDaiAmount.toNumber() + terms.feeDaiAmount.toNumber());
  });

  it("should liquidate after loan due", async function() {
    let block = await ethers.provider.getBlock();
    await basicLoan.setTerms(100, 5, ethers.utils.parseEther("1"), block.timestamp + 100);
    const terms = await basicLoan.terms();
    await dai.approve(basicLoan.address, terms.loanDaiAmount);
    await basicLoan.fundLoan();
    await basicLoan.connect(acccount2).takeALoanAndAcceptLoanTerms({ value: ethers.utils.parseEther("1") });
    const beforeContractETHBalance = await ethers.provider.getBalance(basicLoan.address);
    await increaseTime(125);
    await basicLoan.liquidate();
    const afterContractETHBalance = await ethers.provider.getBalance(basicLoan.address);
    expect(ethers.BigNumber.from(beforeContractETHBalance) - ethers.BigNumber.from(ethers.utils.parseEther("1"))).to.equal(ethers.BigNumber.from(afterContractETHBalance));
  });

});
