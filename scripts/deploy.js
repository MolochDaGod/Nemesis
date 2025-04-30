const hre = require("hardhat");

async function main() {
  const crossmintTreasury = "0xCrossmintTreasury"; // Replace with Crossmint's treasury address
  const GrudgeWarlordsNFT = await hre.ethers.getContractFactory("GrudgeWarlordsNFT");
  const nft = await GrudgeWarlordsNFT.deploy(crossmintTreasury);
  await nft.deployed();
  console.log("GrudgeWarlordsNFT deployed to:", nft.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
