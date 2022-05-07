const main = async() => {
    const [owner, superCoder] = await hre.ethers.getSigners(); // Hardhat will get random address from local eth network
    const domainContractFactory = await hre.ethers.getContractFactory('Domains'); // For Compilation and Generating of necessary files 
    const domainContract = await domainContractFactory.deploy("owl"); // This will create local ethereum network for contract deploy and will destroy local network 
    await domainContract.deployed(); // finally deployment on local eth network
    console.log("Contract Deployed to:", domainContract.address);


    // //First param is domain name - second param is matic value
    // const txn = await domainContract.register("ShaklakaBoomBoom9384387328",{value: hre.ethers.utils.parseEther('0.2')});
    // await txn.wait();

    // //fetch address of domain name
    // const address = await domainContract.getAddress("ShaklakaBoomBoom9384387328");
    // console.log("%s - Owner of Domain : ShaklakaBoomBoom9384387328",address);

    // const balance = await hre.ethers.provider.getBalance(domainContract.address);
    // console.log("%s Matic is the balance of %s",(hre.ethers.utils.formatEther(balance)),domainContract.address);

    console.log("Contract owner:", owner.address);
    
    //Let us get a domain
    let txn = await domainContract.register("AbrakaDabra",{value:hre.ethers.utils.parseEther('25')});
    await txn.wait();   
    console.log("%s - Owner of Domain : AbrakaDabra",owner.address);


    //Now Check balance of Contract
    let contractBalance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract Balance :", hre.ethers.utils.formatEther(contractBalance));

    //Now firstly we will try to withdraw this fund as another user/address
    try{
        txn = await domainContract.connect(superCoder);
        await txn.wait();
    }catch(err){
        console.log("Man You can't Withdraw this Money - ERR for unathorized Withdraw")
    }

    //Now We will withdraw funds to owner but before let us get the balance to compare
    let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
    console.log("Balance of owner before withdrawal:", hre.ethers.utils.formatEther(ownerBalance));

    // Oops, looks like the owner is saving their money!
    txn = await domainContract.connect(owner).withdraw();
    await txn.wait();
    
    // Fetch balance of contract & owner
    contractBalance = await hre.ethers.provider.getBalance(domainContract.address);
    ownerBalance = await hre.ethers.provider.getBalance(owner.address);

    console.log("Contract balance after withdrawal:", hre.ethers.utils.formatEther(contractBalance));
    console.log("Balance of owner after withdrawal:", hre.ethers.utils.formatEther(ownerBalance));


}       

const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();