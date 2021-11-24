import Web3 from 'web3';
const contractABI = require("../contracts/Faices.json"); // TODO: Set Contract
const contractAddress = "0x9DEFdCBBE543a3C07dFf88ce0706023970770665" // TODO: Set Contract Address
const price = 1; //0.04 ETH 40 (calculated with finney) // TODO: Set Price


let web3 = undefined
let contract = undefined
// TODO: Requires Infura or Alchemy API key (websocket)
const web3Alchemy = new Web3('wss://eth-rinkeby.alchemyapi.io/v2/CMOYd_z9dxmUwziC8EN5iB7KKGZ56uC2')


export function isWeb3Ready() {
    return web3 !== undefined
}


// Minten
export async function mintFaices(web3, total, accountFrom, onHash) {
  const contract = new web3.eth.Contract(contractABI.abi, contractAddress);
  const tx = {
    maxPriorityFeePerGas: null,
    maxFeePerGas: null, 
    // this could be provider.addresses[0] if it exists
    from: accountFrom, 
    // target address, this could be a smart contract address
    to: contractAddress, 
    // optional if you want to specify the gas limit 
    // gas: gasLimit, 
    // number of NFT * price per each
    value: web3.utils.toWei(`${price * total}`, 'finney'),
    // this encodes the ABI of the method and the arguments
    data: contract.methods.mintFaices(total).encodeABI() 
  };
  web3.eth.sendTransaction(tx).on('transactionHash', onHash).on('error', function(error){ console.log(error) })
}



export async function getTotalSupply(web3) {
  contract = new web3.eth.Contract(contractABI.abi, contractAddress)
  return contract.methods.totalSupply().call();
}


export async function subscribeMintEvent(callback) {

  const contract = new web3Alchemy.eth.Contract(contractABI.abi, contractAddress);
  
  web3Alchemy.eth.subscribe('logs', {
      address: contract.options.address,
      topics: [web3Alchemy.utils.sha3("FaiceMinted(uint256)")] // TODO:
    }, (error, result) => {
      if (!error && web3Alchemy) {
        console.log(result)
        const eventObj = web3Alchemy.eth.abi.decodeLog(
          [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          result.data,
          result.topics.slice(1)
        )
        console.log(eventObj)
        callback(eventObj.tokenId);
      } else if(error){
        console.error(error)

      }
    })
}

/*export async function subscribeMintEvent(callback) {
  const contract = new web3Alchemy.eth.Contract(contractABI.abi, contractAddress);
  contract.events.FaiceMinted()
  .on("connected", function(subscriptionId){
    console.log("SubscirptionId: " + subscriptionId);
  }).on('data', function(event) {
  
    console.log(event.value); // TODO: json aufbröseln
    
  }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    console.log(`error`);
  });
}*/

// Returns a list of all tokens owned by 'address'
export async function getTokens(web3, address) {
  contract = new web3Alchemy.eth.Contract(contractABI.abi, contractAddress)
  const balance = await contract.methods.balanceOf(address).call();
  if (balance === 0) {
    return [];
  }
  const tokens = await Promise.all(Array.from({length: balance - 1},(v,k)=>k+1).map(el => contract.methods.tokenOfOwnerByIndex(address, el).call()));
  console.log(tokens);
  return tokens;
}
