pragma solidity >=0.6.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract DAI is ERC20 {

  constructor() ERC20('Dai', 'DAI') {
    _mint(msg.sender, 10000000);
  }

}