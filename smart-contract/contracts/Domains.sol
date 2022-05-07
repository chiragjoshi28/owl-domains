// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;
// We first import some OpenZeppelin Contracts.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import { Base64 } from "../libraries/Base64.sol";
import { StringUtils } from "../libraries/StringUtils.sol";
import "hardhat/console.sol";
error Unauthorized();
error AlreadyRegistered();
error InvalidName(string name);


// Inherting our contract
contract Domains is ERC721URIStorage { 

    address payable public owner;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    //Top Level Domain
    string public tld;

    //SVG CODE our on chain NFT image

    string svgPartOne = unicode'<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350" fill="none"><path fill="url(#a)" d="M0 0h350v350H0z"/><defs><filter id="b" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="350" width="350"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949a4.382 4.382 0 0 0-4.394 0l-10.081 6.032-6.85 3.934-10.081 6.032a4.382 4.382 0 0 1-4.394 0l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616 4.54 4.54 0 0 1-.608-2.187v-9.31a4.27 4.27 0 0 1 .572-2.208 4.25 4.25 0 0 1 1.625-1.595l7.884-4.59a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v6.032l6.85-4.065v-6.032a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595L41.456 24.59a4.382 4.382 0 0 0-4.394 0l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595 4.273 4.273 0 0 0-.572 2.208v17.441a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l10.081-5.901 6.85-4.065 10.081-5.901a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v9.311a4.27 4.27 0 0 1-.572 2.208 4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721a4.382 4.382 0 0 1-4.394 0l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616 4.53 4.53 0 0 1-.608-2.187v-6.032l-6.85 4.065v6.032a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l14.864-8.655a4.545 4.545 0 0 0 2.198-3.803V55.538a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#FFF"/><defs><linearGradient id="a" x1="0" y1="0" x2="350" y2="350" gradientUnits="userSpaceOnUse"><stop stop-color="#A7BFE8"/><stop offset="1" stop-color="#4b6cb7" stop-opacity=".99"/></linearGradient></defs><text x="20" y="300" font-size="24" fill="#FFF" filter="url(#b)" font-family="Roboto, Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,sans-serif" font-weight="bold">🦉';
    string svgPartTwo = '</text></svg>';

    //mapping - this data type stores the domains name; 
    mapping(string => address) public domains; //used to link a unique Ethereum address to a corresponding value type.
    mapping(string => string) public records; 
    mapping(uint => string) public names; // will use to return domainNames uint will be TokenIds and string will be names

    //memory is a keyword used to store data for the execution of a contract. It holds functions argument data and is wiped after execution.
    // owner = payable(msg.sender); first excuter or deployer of this contract code is the owner of contract
    constructor(string memory _tld) payable ERC721("OWL Name Service","ONS"){
        owner = payable(msg.sender); 
        tld = _tld;
        console.log("%s name service deployed", _tld);
    }

    //price() - returns the price based on length of string
    // pure functions doesn't read and modify state
    function price(string calldata name) public pure returns(uint) {
        uint len = StringUtils.strlen(name);
        require(len>3,"Domain name is invalid, please use atleast 3 characters");
        if(len==3){
            return 5 * 10**17; // this equals to 0.5 Matic
        }else if(len==4){
            return 3 * 10**17; // this equals to 0.3 Matic
        }else{
            return 1 * 10**17; // this equals to 0.1 Matic
        }
    }

    //Register() adds names to our mapping which will link ETH address to Domain Name
    //calldata vs memdata
    //calldata is used when to store external functional's dynamic params, they are non-modifiable, non-persistent area where function arguments are stored
    //The msg.sender is the address that has called or initiated a function or created a transaction
    //require - to demand something before availing the service to the users ( here we require to check that domain is available or not i.e, name is already mapped to any address ? )
    //Payable ensures that the function can send and receive Ether.
    function register(string calldata name) public payable{
        if(domains[name] != address(0)) revert AlreadyRegistered();
         if (!valid(name)) revert InvalidName(name);
        uint _price = price(name);

        // Check if enough Matic was paid in the transaction
        require(msg.value >= _price, "You dont have enough Matic to buy this domain");

        string memory _name = string(abi.encodePacked(name,".",tld)); // To concat the string as we can't concat string in solidity directly
        string memory finalSvg = string(abi.encodePacked(svgPartOne,_name,svgPartTwo));

        uint256 newRecordId = _tokenIds.current(); // generate unique Id for NFT 
        uint256 length = StringUtils.strlen(name);
        string memory strLen = Strings.toString(length);

        console.log("Registering %s on the Contract with token id %s",name,newRecordId);

        string memory json = Base64.encode(
            abi.encodePacked(
                '{ "name":"',_name,
                '","description": "A Domain name on Owl Name Service","image":"data:image/svg+xml;base64,',Base64.encode(bytes(finalSvg)),
                '","length" : "',strLen,
                '"}'
            )
        );   

        string memory finalTokenUri = string(abi.encodePacked("data:application/json;base64,", json));

        //console.log("\n--------------------------------------------------------");
        //console.log("Final tokenURI", finalTokenUri);
        //console.log("--------------------------------------------------------\n");

        _safeMint(msg.sender, newRecordId);
        _setTokenURI(newRecordId, finalTokenUri);

        domains[name] = msg.sender;
        // console.log("%s has registered a domain!", msg.sender);

        names[newRecordId] = name;
        _tokenIds.increment();
    }

    function valid(string calldata name) public pure returns(bool) {
        return StringUtils.strlen(name) >= 3 && StringUtils.strlen(name) <= 10;
    }

    // a function that only reads but doesn't alter the state variables defined in the contract is called a View Function
    function getAddress(string calldata name) public view returns (address){
        return domains[name];
    }

    //setRecord()
    function setRecord(string calldata name, string calldata record) public{
        if(msg.sender != domains[name]) revert Unauthorized();
        records[name] = record;
    } 

    //getRecord()
    function getRecord(string calldata name) public view returns(string memory){
        return records[name];
    }

    //modifier keyword is used modify the behavior of function
    modifier ownerOnly(){
        require(isOwner());
        _;
    }

    function isOwner() public view returns(bool){
        return msg.sender == owner;
    }
    // here OwnerOnly function will be invoked first and check the condition _; this keyword is modifier function ensures that statment return above will be execute first
    function withdraw() public ownerOnly {
        uint amount = address(this).balance;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to withdraw Matic"); 
    }
   
    function getName() public view returns(string[] memory){
        string[] memory allNames = new string[](_tokenIds.current()); //Dynamic memory arrays are created using new keyword. _tokenIds.current() is size of the array
        for (uint i=0; i < _tokenIds.current(); i++){
            allNames[i] = names[i];
            console.log("Name for token %d is %s", i, allNames[i]); 
        }
        return allNames;
    }

}