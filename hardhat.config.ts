import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3"
import "@nomiclabs/hardhat-etherscan";
require("dotenv").config();

module.exports = {
  solidity: "0.8.7",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  }
};