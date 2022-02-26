import hardhat, { ethers } from 'hardhat';

async function main() {
  await hardhat.run('compile');
  const WoolfTownAPI = await ethers.getContractFactory('WoolfTownAPI');
  const res = await WoolfTownAPI.deploy();
  console.log('WoolfTownAPI', res.address);
}
main();
