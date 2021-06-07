pragma solidity >=0.6.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "hardhat/console.sol";

contract BasicLoan {
  struct Terms {
    uint256 loanDaiAmount;
    uint256 feeDaiAmount;
    uint256 ethCollateralAmount;
    uint256 repayByTimeStamp;
  }
  Terms public terms;

  enum LoanState { Created, Funded, Taken }
  LoanState public state;

  address payable public lender;
  address payable public borrower;
  address public daiAddress;

  IERC20 DAI;

  modifier onlyInState(LoanState expectedState) {
    require(state == expectedState, "Not allowed in this state");
    _;
  }

  constructor(address _daiAddress) {
    daiAddress = _daiAddress;
    DAI = IERC20(_daiAddress);
    lender = payable(msg.sender);
    state = LoanState.Created;
  }

  function setTerms(
    uint256 _loanDaiAmount,
    uint256 _feeDaiAmount,
    uint256 _ethCollateralAmount,
    uint256 _repayByTimeStamp) public {
    require(lender == msg.sender, "Only lender can set this terms");
    terms = Terms({
      loanDaiAmount: _loanDaiAmount,
      feeDaiAmount: _feeDaiAmount,
      ethCollateralAmount: _ethCollateralAmount,
      repayByTimeStamp: _repayByTimeStamp
    });
  }

  function fundLoan() public onlyInState(LoanState.Created) {
    state = LoanState.Funded;
    DAI.transferFrom(
      msg.sender,
      address(this),
      terms.loanDaiAmount
    );
  }

  function takeALoanAndAcceptLoanTerms() public payable onlyInState(LoanState.Funded) {
    require(
      msg.value == terms.ethCollateralAmount,
      "Invalid collateral amount"
    );
    borrower = payable(msg.sender);
    state = LoanState.Taken;
    DAI.transfer(borrower, terms.loanDaiAmount);
  }

  function repay() public onlyInState(LoanState.Taken) {
    require(borrower == msg.sender, "only borrower can repay the loan");
    DAI.transferFrom(
      borrower,
      lender,
      terms.loanDaiAmount + terms.feeDaiAmount
    );
    selfdestruct(borrower);
  }

  function liquidate() public onlyInState(LoanState.Taken) {
    require(msg.sender == lender, "only lender can liquidate the loan");
    require(
      block.timestamp > terms.repayByTimeStamp,
      "Can not liquidate before the loan due"
    );
    lender.transfer(address(this).balance);
    selfdestruct(lender);
  }


}