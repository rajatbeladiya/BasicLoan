const ethers = require('ethers');

const toWei = (val) => ethers.utils.parseEther('' + val)
const fromWei = (val) => ethers.utils.formatEther('' + val)

module.exports = {
  toWei,
  fromWei
}
