require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load environment variables
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.20",
	networks: {
		sepolia: {
			url: SEPOLIA_RPC_URL,
			accounts: [PRIVATE_KEY],
		},
	},
	paths: {
		sources: "./contracts",
		tests: "./test",
		cache: "./cache",
		artifacts: "./artifacts"
	}
};
