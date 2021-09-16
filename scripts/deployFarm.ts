import { ethers } from "hardhat";

const ropstenWeth = {
  address: "0xc778417e063141139fce010982780140aa0cd5ab"
};

const main = async () => {
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying contracts with ${deployer.address}`);

  const BbwlToken = await ethers.getContractFactory("BbwlToken")
  const bbwlToken = await BbwlToken.deploy()
  console.log(`BbwlToken address: ${bbwlToken.address}`)

  const BbwlFarm = await ethers.getContractFactory("BbwlFarm")
  const bbwlFarm = await BbwlFarm.deploy(ropstenWeth.address, bbwlToken.address)
  console.log(`BbwlFarm address: ${bbwlFarm.address}`)

  await bbwlToken._transferOwnership(bbwlFarm.address)
  console.log(`BbwlToken ownership transferred to ${bbwlFarm.address}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error)
    process.exit(1)
  });