require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    polygon: {
      url: "https://polygon-rpc.com/zkevm", // Replace with your Polygon RPC endpoint
      accounts: ["44e0c590ea4f65e09c50eb4db894ea2e780d7948d6be2cb973a7d639a080afe1"  ] // Replace with your wallet private key
    }
  }
};require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    polygon: {
      url: "https://polygon-rpc.com/zkevm", // Replace with your Polygon RPC endpoint
      accounts: ["44e0c590ea4f65e09c50eb4db894ea2e780d7948d6be2cb973a7d639a080afe1"] // Replace with your wallet private key
    }
  }
};
