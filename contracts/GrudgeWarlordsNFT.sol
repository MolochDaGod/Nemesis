// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GrudgeWarlordsNFT is ERC721, Ownable {
    uint256 private 69e05c42-9508-468f-884d-5f0b13645228 _tokenIdCounter;
    address private 0x21768Ed2C27475C898AEa5F98141E30203E5EFc5 _crossmintTreasury;
    mapping(address => bool) private _whitelisted;

    constructor(address crossmintTreasury) ERC721("GrudgeWarlordsNFT", "GWNFT") Ownable(msg.sender) {
        _tokenIdCounter = 0;
        _crossmintTreasury = crossmintTreasury;
        _whitelisted[crossmintTreasury] = true;
    }

    function mintTo(address recipient) public payable returns (uint256) {
        require(_whitelisted[msg.sender] || msg.sender == owner(), "Caller not whitelisted or owner");
        _tokenIdCounter += 1;
        uint256 newTokenId = _tokenIdCounter;
        _safeMint(recipient, newTokenId);
        return newTokenId;
    }

    function setWhitelisted(address account, bool status) public onlyOwner {
        _whitelisted[account] = status;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Return metadata URL (to be updated with IPFS or GCS-hosted metadata)
        return string(abi.encodePacked("https://storage.googleapis.com/nexus-nemesis-assets-model-wave-458100-h7/metadata/", tokenId, ".json"));
    }
}