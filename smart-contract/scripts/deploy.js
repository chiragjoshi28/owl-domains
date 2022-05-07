const main = async() => { 

    const domainContractFactory = await hre.ethers.getContractFactory('Domains'); 
    const domainContract = await domainContractFactory.deploy("owl");
    await domainContract.deployed();
    console.log("Contract Deployed to:", domainContract.address);

    // //First param is domain name - second param is matic value
    // let txn = await domainContract.register("HarryPotter",{value: hre.ethers.utils.parseEther('0.2')});
    // await txn.wait();
    // console.log("Minted domain HarryPotter.owl");

    // txn = await domainContract.setRecord("HarryPotter","Hi i am from hogwarts")
    // await txn.wait();
    // console.log("Record Set For HarryPotter.owl");

    // //fetch address of domain name
    // const address = await domainContract.getAddress("HarryPotter");
    // console.log("%s - Owner of Domain : HarryPotter",address);

    // const balance = await hre.ethers.provider.getBalance(domainContract.address);
    // console.log("%s Matic is the balance of %s",(hre.ethers.utils.formatEther(balance)),domainContract.address);


    

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