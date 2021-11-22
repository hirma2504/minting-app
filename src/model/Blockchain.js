import Web3 from 'web3';
const contractABI = require("../contracts/Faices.json"); // TODO: Set Contract
const contractAddress = "0xc0AEA18AD202251184B0Ee48030b8a7904DeC636" // TODO: Set Contract Address
const price = 1; //0.04 ETH 40


let web3 = undefined
let contract = undefined
// TODO: Requires Infura or Alchemy API key
const web3Alchemy = new Web3('https://eth-rinkeby.alchemyapi.io/v2/CMOYd_z9dxmUwziC8EN5iB7KKGZ56uC2')
let subscription = undefined

export function isWeb3Ready() {
    return web3 !== undefined
}

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

/*export async function subscribeMintEvent(callback) {
  contract = new web3Alchemy.eth.Contract(contractABI.abi, contractAddress)
  const eventJsonInterface = web3Alchemy.utils._.find(
    contract._jsonInterface,
    o => o.name === 'FaiceMinted' && o.type === 'event',
  )
  subscription = web3Alchemy.eth.subscribe('logs', {
      address: contract.options.address,
      topics: [eventJsonInterface.signature]
    }, (error, result) => {
      if (!error && web3Alchemy) {
        const eventObj = web3Alchemy.eth.abi.decodeLog(
          eventJsonInterface.inputs,
          result.data,
          result.topics.slice(1)
        )
        callback(eventObj.tokenId)
      }
    })
}*/

export async function subscribeMintEvent(callback) {

  const contract = new web3Alchemy.eth.Contract(contractABI.abi, contractAddress);
  subscription = web3Alchemy.eth.subscribe('logs', {
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
      }
    })
}

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
