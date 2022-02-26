// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/// @title WoolfTownAPI
/// @author imconfig
contract WoolfTownAPI {
  function ERC721TokenIds(
    address user_,
    ERC721Enumerable erc721_,
    uint256 from_,
    uint256 to_
  ) public view returns (uint256[] memory ids, uint256 balance) {
    uint256 _to = to_;
    balance = erc721_.balanceOf(user_);
    if (balance < _to) _to = balance;
    require(from_ < _to, 'index out of range');
    ids = new uint256[](_to - from_);
    for (uint256 i = 0; i < ids.length; i++) {
      ids[i] = erc721_.tokenOfOwnerByIndex(user_, from_ + i);
    }
  }

  function ERC721TokenURIs(uint256[] calldata ids_, ERC721Enumerable erc721_) public view returns (string[] memory list) {
    list = new string[](ids_.length);
    for (uint256 i = 0; i < ids_.length; i++) {
      list[i] = erc721_.tokenURI(ids_[i]);
    }
  }

  function ERC20Balances(address user_, ERC20[] calldata erc20s_) public view returns (uint256[] memory balances) {
    balances = new uint256[](erc20s_.length);
    for (uint256 i = 0; i < erc20s_.length; i++) {
      balances[i] = erc20s_[i].balanceOf(user_);
    }
  }

  function ERC20Allowance(
    address user_,
    ERC20[] calldata erc20s_,
    address to
  ) public view returns (uint256[] memory balances, uint256[] memory allowance) {
    uint256 length = erc20s_.length;
    balances = new uint256[](length);
    allowance = new uint256[](length);
    for (uint256 idx = 0; idx < length; ++idx) {
      balances[idx] = erc20s_[idx].balanceOf(user_);
      allowance[idx] = erc20s_[idx].allowance(user_, to);
    }
  }
}
