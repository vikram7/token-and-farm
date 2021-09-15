import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@openzeppelin/test-helpers";

describe("BbwlFarm", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let res: any;
  let bbwlFarm: Contract;
  let bbwlToken: Contract;
  let mockWeth: Contract;

  const wethAmount: BigNumber = ethers.utils.parseEther("25000");

  beforeEach(async () => {
    const BbwlFarm = await ethers.getContractFactory("BbwlFarm");
    const BbwlToken = await ethers.getContractFactory("BbwlToken");
    const MockWeth = await ethers.getContractFactory("MockERC20");
    mockWeth = await MockWeth.deploy("MockWeth", "mWETH");
    [owner, alice, bob] = await ethers.getSigners();
    await Promise.all([
      mockWeth.mint(owner.address, wethAmount),
      mockWeth.mint(alice.address, wethAmount),
      mockWeth.mint(bob.address, wethAmount)
    ]);
    bbwlToken = await BbwlToken.deploy();
    bbwlFarm = await BbwlFarm.deploy(mockWeth.address, bbwlToken.address);
  })

  describe("Init", async () => {
    it("should initialize", async () => {
      expect(await bbwlToken).to.be.ok
      expect(await bbwlFarm).to.be.ok
      expect(await mockWeth).to.be.ok
    })
  })

  describe("Stake", async () => {
    it("should accept WETH and update mapping", async () => {
      let toTransfer = ethers.utils.parseEther("100")
      await mockWeth.connect(alice).approve(bbwlFarm.address, toTransfer)

      expect(await bbwlFarm.isStaking(alice.address))
        .to.eq(false)

      expect(await bbwlFarm.connect(alice).stake(toTransfer))
        .to.be.ok

      expect(await bbwlFarm.stakingBalance(alice.address))
        .to.eq(toTransfer)

      expect(await bbwlFarm.isStaking(alice.address))
        .to.eq(true)
    })

    it("should update balance with multiple stakes", async () => {
      let toTransfer = ethers.utils.parseEther("100")
      await mockWeth.connect(alice).approve(bbwlFarm.address, toTransfer)
      await bbwlFarm.connect(alice).stake(toTransfer)

      await mockWeth.connect(alice).approve(bbwlFarm.address, toTransfer)
      await bbwlFarm.connect(alice).stake(toTransfer)

      expect(await bbwlFarm.stakingBalance(alice.address))
        .to.eq(ethers.utils.parseEther("200"))
    })

    it("should revert with not enough funds", async () => {
      let toTransfer = ethers.utils.parseEther("1000000")
      await mockWeth.approve(bbwlFarm.address, toTransfer)

      await expect(bbwlFarm.connect(bob).stake(toTransfer))
        .to.be.revertedWith("You cannot stake zero tokens")
    })
  })

  describe("Unstake", async () => {
    beforeEach(async () => {
      let toTransfer = ethers.utils.parseEther("100")
      await mockWeth.connect(alice).approve(bbwlFarm.address, toTransfer)
      await bbwlFarm.connect(alice).stake(toTransfer)
    })

    it("should unstake balance from user", async () => {
      let toTransfer = ethers.utils.parseEther("100")
      await bbwlFarm.connect(alice).unstake(toTransfer)

      res = await bbwlFarm.stakingBalance(alice.address)
      expect(Number(res))
        .to.eq(0)

      expect(await bbwlFarm.isStaking(alice.address))
        .to.eq(false)
    })
  })

  describe("WithdrawYield", async () => {

    beforeEach(async () => {
      await bbwlToken._transferOwnership(bbwlFarm.address)
      let toTransfer = ethers.utils.parseEther("10")
      await mockWeth.connect(alice).approve(bbwlFarm.address, toTransfer)
      await bbwlFarm.connect(alice).stake(toTransfer)
    })

    it("should return correct yield time", async () => {
      let timeStart = await bbwlFarm.startTime(alice.address)
      expect(Number(timeStart))
        .to.be.greaterThan(0)

      // Fast-forward time
      await time.increase(86400)

      expect(await bbwlFarm.calculateYieldTime(alice.address))
        .to.eq((86400))
    })

    it("should mint correct token amount in total supply and user", async () => {
      await time.increase(86400)

      let _time = await bbwlFarm.calculateYieldTime(alice.address)
      let formatTime = _time / 86400
      let staked = await bbwlFarm.stakingBalance(alice.address)
      let bal = staked * formatTime
      let newBal = ethers.utils.formatEther(bal.toString())
      let expected = Number.parseFloat(newBal).toFixed(3)

      await bbwlFarm.connect(alice).withdrawYield()

      res = await bbwlToken.totalSupply()
      let newRes = ethers.utils.formatEther(res)
      let formatRes = Number.parseFloat(newRes).toFixed(3).toString()

      expect(expected)
        .to.eq(formatRes)

      res = await bbwlToken.balanceOf(alice.address)
      newRes = ethers.utils.formatEther(res)
      formatRes = Number.parseFloat(newRes).toFixed(3).toString()

      expect(expected)
        .to.eq(formatRes)
    })

    it("should update yield balance when unstaked", async () => {
      await time.increase(86400)
      await bbwlFarm.connect(alice).unstake(ethers.utils.parseEther("5"))

      res = await bbwlFarm.bbwlBalance(alice.address)
      expect(Number(ethers.utils.formatEther(res)))
        .to.be.approximately(10, .001)
    })

  })
})