const hre = require("hardhat");
//Main function
//Run with npx hardhat run scripts/deploy.js --network localhost
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  // Deploy ReputationNFT contract
  const ReputationNFT = await hre.ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  console.log("ReputationNFT deployed to:", await reputationNFT.getAddress());
  // Deploy LoanContract with NFT contract address
  const LoanContract = await hre.ethers.getContractFactory("LoanContract");
  const loanContract = await LoanContract.deploy(await reputationNFT.getAddress());
  await loanContract.waitForDeployment();
  console.log("LoanContract deployed to:", await loanContract.getAddress());
  // Transfer ownership of NFT contract to LoanContract
  const tx = await reputationNFT.transferOwnership(await loanContract.getAddress());
  await tx.wait();
  console.log("ReputationNFT ownership transferred to LoanContract");
}
//Execute script and handle errors
main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
