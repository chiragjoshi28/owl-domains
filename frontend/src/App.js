import React,{useEffect,useState} from 'react';
import { ethers } from 'ethers';
import { networks } from './utils/networks';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import opensea from './assets/opensea.svg';
import contractAbi from './utils/Domains.json';
import polygonLogo from './assets/polygon.png';
import { FaQuestionCircle } from 'react-icons/fa'
import {BiLoaderAlt,BiArrowBack} from 'react-icons/bi'
import { FetchWrapper } from "use-nft"

// Constants
const TWITTER_HANDLE = 'chiragjoshi28';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const owl_contract_address = "0x4329b11F3bebe135944f92043BCb752D2EBC36cf";
const ALCHEMY_API_URL = process.env.REACT_APP_ALCHEMY_API_URL;
const explorerLink = "https://mumbai.polygonscan.com/";
const openseaLink = "https://testnets.opensea.io/assets/mumbai/"

const tld = '.owl';
const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [network, setNetwork] = useState('');
	const [domain, setDomain] = useState('');
  	const [record, setRecord] = useState('');
	const [mints, setMints] = useState([]);
	const [loading,setLoading] = useState(true);
	const [editing,setEditing] = useState(false);
	const [viewDomain, setViewDomain] = useState('');

	let renderMiddleSection = "";

	// Implement your connectWallet method here
	const connectWallet = async () => {
	try {
		const { ethereum } = window;

		if (!ethereum) {
		alert("Get MetaMask -> https://metamask.io/");
		return;
		}

		// Fancy method to request access to account.
		const accounts = await ethereum.request({ method: "eth_requestAccounts" });
	
		// Boom! This should print out public address once we authorize Metamask.
		console.log("Connected", accounts[0]);
		setCurrentAccount(accounts[0]);
	} catch (error) {
		console.log(error)
	}
	}

	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;
	
		if (!ethereum) {
		  console.log('Make sure you have metamask!');
		  setLoading(false)
		  return;
		} else {
		  console.log('We have the ethereum object', ethereum);
		}
		
		// Check if we're authorized to access the user's wallet
		const accounts = await ethereum.request({ method: 'eth_accounts' });
	
		// Users can have multiple authorized accounts, we grab the first one if its there!
		if (accounts.length !== 0) {
		  const account = accounts[0];
		  console.log('Found an authorized account:', account);
		  setCurrentAccount(account);
		} else {
		  console.log('No authorized account found');
		  setLoading(false)
		}

		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);
		setLoading(false)
		ethereum.on('chainChanged', handleChainChanged);

		 // Reload the page when they change networks
		 function handleChainChanged(_chainId) {
			window.location.reload();
		  }
	}

	const switchNetwork = async () => {
		if (window.ethereum) {
		  try {
			// Try to switch to the Mumbai testnet
			await window.ethereum.request({
			  method: 'wallet_switchEthereumChain',
			  params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
			});
		  } catch (error) {
			if (error.code === 4902) {
			  try {
				await window.ethereum.request({
				  method: 'wallet_addEthereumChain',
				  params: [
					{	
					  chainId: '0x13881',
					  chainName: 'Polygon Mumbai Testnet',
					  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
					  nativeCurrency: {
						  name: "Mumbai Matic",
						  symbol: "MATIC",
						  decimals: 18
					  },
					  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
					},
				  ],
				});
			  } catch (error) {
				console.log(error);
			  }
			}
			console.log(error);
		  }
		} else {
		  // If window.ethereum is not found then MetaMask is not installed
		  alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		} 
	}
	function beautifyAddress(address){
		return (address.slice(0, 6)+"..."+address.slice(-4))
	}
	const mintDomain = async() => {
		if(!domain){ return }
		if(domain>=3 || domain<=10) { alert('Domain must be greater than 3 and less than 50 characters'); return; }
		const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
		console.log("Minting domain", domain, "with price", price);

		try{
			const { ethereum } = window;
			if(ethereum){
				setLoading(true);
				const providers = new ethers.providers.Web3Provider(ethereum);
				const signer = providers.getSigner();
				const contract = new ethers.Contract(owl_contract_address,contractAbi.abi,signer);
				console.log("Going to pop wallet now to pay gas...")

				let txn = await contract.register(domain,{value:ethers.utils.parseEther(price)});
				const receipt = await txn.wait();
				if(receipt.status===1){
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+txn.hash);
					
					// Set the record for the domain
					txn = await contract.setRecord(domain, record);
					await txn.wait();
					
					console.log("Record set! https://mumbai.polygonscan.com/tx/"+txn.hash);
					
					// Call fetchMints after 2 seconds
					setTimeout(() => {
						fetchMints();
					}, 2000);
					  
						  
					setRecord('');
					setDomain('');
					setLoading(false);
				}else{
					alert("Transaction failed! Please try again");
				}
			}else{
				console.log("ethereum is null")
			}
		}catch(err){
			alert(err.data.message);
			setLoading(false);
		}
	}

	//fetchMints
	const fetchMints = async() => {
		try{
			const { ethereum } = window;
			if(ethereum){
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(owl_contract_address,contractAbi.abi,signer);

				//Get Names
				const names = await contract.getName();

				const mintRecords = await Promise.all(names.map( async (name) =>{
					const mintRecord = await contract.records(name);
					const owner = await contract.domains(name);
					return {
						id:names.indexOf(name),
						name:name,
						record:mintRecord,
						owner:owner

					}
				}))
				console.log("MINTS FETCHED ", mintRecords);
    			setMints(mintRecords);
			}
		}catch(error){
			console.log(error);
		}
	}

	//RenderMints
	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
			return(
				<div className="mt-8"> 
					<h2 className="text-white text-center text-xl">Recent minted .OWLers</h2>
					<div className="w-full mt-8 flex flex-row flex-wrap justify-center items-center">
						{ mints.map((mint,index)=>
							<p key={index} className="m-2 border border-slate-400 hover:border-slate-300 rounded-full px-4 py-2 text-white text-center">
								<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${owl_contract_address}/${mint.id}`} target="_blank" rel="noopener noreferrer">
									{mint.name}{tld}
								</a>
								{ 
									mint.owner.toLowerCase === currentAccount.toLowerCase
									?  <button className="ml-2" onClick={()=>editRecord(mint.name)}> ✏️ </button>
									: ''
								}
								<button className="ml-2" onClick={()=>fetchDomainByMetaData(index,mint)}> ℹ️ </button>
							</p>

						)}
					</div>
				</div>
			)
		}
	}

	//FetchFromBlockChain
	const fetchDomainByMetaData = async(tokenId,mint) => 
	{
	
		try{
			setLoading(true)
			const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
			const fetcher = ["ethers", { ethers, provider: provider }]
			const fetchWrapper = new FetchWrapper(fetcher);
			const result = await fetchWrapper.fetchNft( owl_contract_address,tokenId);
			let data = {
				name:result.rawData.name,
				record:mint.record,
				owner:mint.owner,
				image:result.rawData.image,
				description:result.rawData.description,
				tokenId:tokenId
			}
			setViewDomain(data);
			setLoading(false)
		}catch(error){
			console.log(error)
			setLoading(false)
		}

		
	}

	//Editing enabled
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	}

	//Update Record
	const updateDomain = async () => {
		if (!record || !domain) { return }
		setLoading(true);
		console.log("Updating domain", domain, "with record", record);
		  try {
		  const { ethereum } = window;
		  if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(owl_contract_address, contractAbi.abi, signer);
	  
			let tx = await contract.setRecord(domain, record);
			await tx.wait();
			console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);
	  
			fetchMints();
			setRecord('');
			setDomain('');
		  }
		  } catch(error) {
			console.log(error);
		  }
		setLoading(false);
	}

	useEffect(() => {
		if(!currentAccount && !network) { 
			checkIfWalletIsConnected(); 
		}
		if(currentAccount && network === "Polygon Mumbai Testnet"){ 
			console.log("network"+network); 
			fetchMints(); 
			setLoading(false)
		}
		if(network !== "Polygon Mumbai Testnet"){ /*setLoading(false) */ }
		
	}, [currentAccount, network]);

	if(loading){
		renderMiddleSection = <div className="flex flex-col justify-center items-center"> <BiLoaderAlt className="icon_pulse" color="white" size="64"/></div>
	}else if(!loading && viewDomain){
		renderMiddleSection = 
		<>
		<div className="flex ml-8 mb-4"><BiArrowBack color="#fff" size="28" onClick={() => {setViewDomain('')}}></BiArrowBack></div>
		<div className="flex flex-col md:flex-row justify-center">
			<div className="w-full md:w-5/12">
				<img src={viewDomain.image} className="w-70 h-70 mx-auto border border-slate-500 p-6 rounded-xl" />
			</div>
			<div className="w-full md:w-7/12 ml-4">
				<div className="flex flex-col">
					<h4 className="text-cyan-400">ONS : OWL Name Service</h4>
					<h2 className="text-white text-3xl mt-8 mb-8">{viewDomain.name}</h2>
					<h4 className="text-white mb-5">Owned by : <a className="text-cyan-400" target="_blank" href={explorerLink+"address/"+viewDomain.owner}>{beautifyAddress(viewDomain.owner)}</a></h4>
					<h4 className="text-white mb-5">Record : <span className="text-cyan-400" >{viewDomain.record}</span></h4>
				</div>
				<table class="border-collapse table-auto w-full text-sm">
					<thead>
						<tr><th className="text-cyan-400 border-b border-slate-700 text-left py-3" colSpan={2}>About</th></tr>
					</thead>
					<tbody>
						<tr>
							<td className="text-white border-b border-slate-700 py-3">Contract</td>
							<td className="text-cyan-400 border-b border-slate-700">
								<div className="flex">
									<span>{beautifyAddress(owl_contract_address)}</span>
									<a target="_blank" href={explorerLink+"token/"+owl_contract_address}><img className="w-6 h-6 ml-3" src={polygonLogo}/></a>
									<a target="_blank" href={openseaLink+owl_contract_address+"/"+viewDomain.tokenId}><img className="w-6 h-6 ml-3" src={opensea}/></a>
								
								</div>
							</td>
						</tr>
						<tr>
							<td className="text-white border-b border-slate-700 py-3">Token Id</td>
							<td className="text-cyan-400 border-b border-slate-700"><a target="_blank" href={explorerLink+"/token/"+owl_contract_address+"?a="+viewDomain.tokenId}>{ viewDomain.tokenId }</a></td>
						</tr>
						<tr>
							<td className="text-white border-b border-slate-700 py-3">Blockchain</td>
							<td className="text-cyan-400 border-b border-slate-700">{network}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		</>
	}else if(!loading && !currentAccount){
		renderMiddleSection = 
		<div className="flex flex-col justify-center items-center">
			<h1 className="w-full text-xl md:text-4xl text-white text-center">Your Web3 Username with .owl</h1>
			<h3 className="w-full text-sm md:text-xl text-white text-center w-full md:w-7/12 mt-2">Get yourself a record which stays forever and never expire, this isn't a regular Crypto Name Service, .owl gives you identity which is controlled by you.</h3>
			<button onClick={connectWallet} className="text-white mt-8 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-4 py-2" >
				Connect Wallet
			</button>
		</div>;
	}else if(!loading && currentAccount && network !== 'Polygon Mumbai Testnet'){
		renderMiddleSection =
			  <div className="flex flex-col justify-center">
				  	<div className="flex text-white justify-center">
						<p className="text-white w-10/12 md:w-4/12 text-center">Please connect to the Polygon Mumbai Testnet</p>
					</div>
					<div className="flex text-white justify-center">
						<button className="bg-cyan-500 text-white px-4 py-2 rounded-xl hover:bg-cyan-600 mt-8" disabled={null} onClick={switchNetwork}>
							Switch network
						</button>  
					</div>
			  </div>
	}else if(!loading && currentAccount && network === 'Polygon Mumbai Testnet'){
		renderMiddleSection =  
			<div className="form-container flex flex-col justify-center">
				<div className="flex text-white justify-center">
					<h3 className=" text-white mb-8 text-2xl w-10/12 sm:w-8/12 md:w-6/12 lg:w-4/12 text-center">Here You Go! Just Search out the perfect .owl domain for you</h3>
				</div>
				<div className="flex text-white justify-center">
					<div className="flex bg-slate-800 px-4 py-2 rounded-xl w-10/12 sm:w-8/12 md:w-6/12 lg:w-3/12">
						<input className="bg-transparent border-transparent outline-none w-full" type="text" value={domain} placeholder='domain' onChange={e => setDomain(e.target.value)}/>
						<p className="tld"> {tld} </p>
					</div>
				</div>
				<div className="flex text-white justify-center mt-4">
					<div className="flex bg-slate-800 px-4 py-2 rounded-xl w-10/12 sm:w-8/12 md:w-6/12 lg:w-5/12">
						<input className="bg-transparent border-transparent outline-none w-full" type="text" value={record} placeholder="Your Domain Record" onChange={e => setRecord(e.target.value)} />
					</div>
				</div>
				<div className="flex justify-center mt-8">
					{
						editing 
					?
						(<div className="edit-buttons">
							<button className="bg-cyan-500 text-white px-4 py-2 rounded-xl hover:bg-cyan-600" disabled={loading} onClick={updateDomain}>
							Update Record
							</button> 
							<button className="bg-white text-black px-4 py-2 rounded-xl hover:bg-gray-400 ml-2" onClick={() => {setEditing(false);setDomain('')}}>
							Cancel
							</button> 
						</div>)

					: 	<button className="bg-cyan-500 text-white px-4 py-2 rounded-xl hover:bg-cyan-600" disabled={loading} onClick={mintDomain}>
							Mint it now !
						</button>  
					}
				</div>
				{(mints) && renderMints()}
			</div>
	}

  return (
	  <div className="bg-[#0F172A]">
			<div className="App flex flex-col min-h-screen justify-between px-4 md:px-8 ">		
				<header className="text-white w-full z-30 top-0 text-white py-4 lg:py-6 md:flex">
					<div className="left w-full md:w-6/12">
					<p className="text-3xl text-white font-bold">🦉 .owl Name Service</p>
					</div>
					<div className="right flex items-center mt-2 md:mt-0 justify-center md:justify-end  w-full md:w-6/12">
						<div className="flex px-4 py-2 rounded-2xl bg-slate-800">
							
							{ ( network.includes("Polygon") ) ? <img alt="Network logo" className="w-6 mr-2" src={polygonLogo} />: <div className="react-icons"><FaQuestionCircle size="18" className="mr-2" color="white"></FaQuestionCircle></div> }
							{ currentAccount ? <p> Wallet: {beautifyAddress(currentAccount)} </p> : <p> Not connected </p> }
						</div>
					</div>	
				</header>
				{ renderMiddleSection }
				<footer className="flex justify-center items-center ">
					<img alt="Twitter Logo" className="twitter-logo w-8" src={twitterLogo} />
					<a
						className="text-white"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`build by @${TWITTER_HANDLE}`}</a>
				</footer>
			</div>
		</div>
	);
}

export default App;
