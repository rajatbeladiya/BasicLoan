const hre = require('hardhat');

async function main() {
  const DAI = await hre.ethers.getContractFactory("DAI");
  const dai = await DAI.deploy();
  await dai.deployed();

  const BasicLoan = await hre.ethers.getContractFactory("BasicLoan");
  const basicLoan = await BasicLoan.deploy(dai.address);
  await basicLoan.deployed();

  console.log('basicLoan deployed to ===== ', basicLoan.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });