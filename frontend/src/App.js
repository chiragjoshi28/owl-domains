import React,{useEffect,useState} from 'react';
import { ethers } from 'ethers';
import { networks } from './utils/networks';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import contractAbi from './utils/Domains.json';
import polygonLogo from './assets/polygon.png';
import { FaQuestionCircle } from 'react-icons/fa'

// Constants
const TWITTER_HANDLE = 'chiragjoshi28';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const owl_contract_address = "0x4329b11F3bebe135944f92043BCb752D2EBC36cf";

const tld = '.owl';
const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [network, setNetwork] = useState('');
	const [domain, setDomain] = useState('');
  	const [record, setRecord] = useState('');

	const [mints, setMints] = useState([]);

	const[loading,setLoading] = useState(false);
	const[editing,setEditing] = useState(false);

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
		}

		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);
	
		ethereum.on('chainChanged', handleChainChanged);

		 // Reload the page when they change networks
		 function handleChainChanged(_chainId) {
			window.location.reload();
		  }
	};

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
	// Form to enter domain name and data
	const renderInputForm = () =>{
		// If not on Polygon Mumbai Testnet, render "Please connect to Polygon Mumbai Testnet"
		if (network !== 'Polygon Mumbai Testnet') {
			return (
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
			
			);
		  }
		
		return (
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
							<button className="bg-white text-black px-4 py-2 rounded-xl hover:bg-cyan-600 ml-2" onClick={() => {setEditing(false)}}>
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
		);
	}

	// Render Methods
	const renderNotConnectedContainer = () => (
		<div className="flex flex-col justify-center items-center">
			<h1 className="w-full text-xl md:text-4xl text-white text-center">Your Web3 Username with .owl</h1>
			<h3 className="w-full text-sm md:text-xl text-white text-center w-full md:w-7/12 mt-2">Get yourself a record which stays forever and never expire, this isn't a regular Crypto Name Service, .owl gives you identity which is controlled by you.</h3>
			<button onClick={connectWallet} className="text-white mt-8 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-4 py-2" >
				Connect Wallet
			</button>
		</div>
	);

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
					<div className="w-full mt-8 flex flex-col sm:flex-row justify-center items-center">
						{ mints.map((mint,index)=>
							<p key={index} className="m-2 border border-slate-400 hover:border-slate-300 rounded-full px-4 py-2 text-white text-center">
								<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${owl_contract_address}/${mint.id}`} target="_blank" rel="noopener noreferrer">
									{mint.name}{tld}
								</a>
								{ 
									mint.owner.toLowerCase === currentAccount.toLowerCase
									? <button className="ml-2" onClick={()=>editRecord(mint.name)}> ✏️ </button>
									: ''
								}
							</p>

						)}
					</div>
				</div>
			)
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
		console.log(network);
		if(!currentAccount && !network) { 
			checkIfWalletIsConnected(); 
			//saveTempSvg("chiku",'<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#a)" d="M0 0h270v270H0z"/><defs><filter id="b" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949a4.382 4.382 0 0 0-4.394 0l-10.081 6.032-6.85 3.934-10.081 6.032a4.382 4.382 0 0 1-4.394 0l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616 4.54 4.54 0 0 1-.608-2.187v-9.31a4.27 4.27 0 0 1 .572-2.208 4.25 4.25 0 0 1 1.625-1.595l7.884-4.59a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v6.032l6.85-4.065v-6.032a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595L41.456 24.59a4.382 4.382 0 0 0-4.394 0l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595 4.273 4.273 0 0 0-.572 2.208v17.441a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l10.081-5.901 6.85-4.065 10.081-5.901a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v9.311a4.27 4.27 0 0 1-.572 2.208 4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721a4.382 4.382 0 0 1-4.394 0l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616 4.53 4.53 0 0 1-.608-2.187v-6.032l-6.85 4.065v6.032a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l14.864-8.655a4.545 4.545 0 0 0 2.198-3.803V55.538a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#FFF"/><defs><linearGradient id="a" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#A7BFE8"/><stop offset="1" stop-color="#4b6cb7" stop-opacity=".99"/></linearGradient></defs><text x="20" y="231" font-size="20" fill="#FFF" filter="url(#b)" font-family="Roboto, Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,sans-serif" font-weight="bold">🦉OkSi9r.owl</text></svg>');
		}
		if(currentAccount && network === "Polygon Mumbai Testnet") { console.log("network"+network); fetchMints(); }
		
	}, [currentAccount, network]);

  return (
		<div className="App flex flex-col h-screen justify-between px-4 md:px-8 bg-[#0F172A] ">		
			<header className="text-white w-full z-30 top-0 text-white py-4 lg:py-6 md:flex">
				<div className="left w-full md:w-6/12">
				<p className="text-3xl text-white font-bold">🦉 .owl Name Service</p>
				</div>
				<div className="right flex items-center mt-2 md:mt-0 justify-center md:justify-end  w-full md:w-6/12">
					<div className="flex px-4 py-2 rounded-2xl bg-slate-800">
						
						{ ( network.includes("Polygon") ) ? <img alt="Network logo" className="w-6 mr-2" src={polygonLogo} />: <div className="react-icons"><FaQuestionCircle size="18" className="mr-2" color="white"></FaQuestionCircle></div> }
						{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
					</div>
				</div>	
			</header>
			{/* Hide the connect button if currentAccount isn't empty*/}
			{!currentAccount && renderNotConnectedContainer()}
			{currentAccount && renderInputForm()}
			
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
	);
}

export default App;
