import './App.css'
import openLink from './assets/open-link-w.svg'
import metamask from './assets/metamask.svg'
import walletConnect from './assets/walletc.svg'
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider';
import { mintFaices, getTotalSupply, subscribeMintEvent } from "./model/Blockchain"
import { useEffect, useState, useCallback } from 'react'
import { Container, Row, Col, Button, Alert, Modal} from 'react-bootstrap'
import WalletConnectProvider from "@walletconnect/web3-provider";
import backVid from './assets/faices.mp4'
import faicesLogo from "./assets/faicesLogo.png";
import ring1 from "./assets/rings_blue/Mask Copy 2_3x.svg";
import ring2 from "./assets/rings_blue/Mask Copy 3_3x.svg";
import ring3 from "./assets/rings_blue/Mask Copy_3x.svg";
import ring4 from "./assets/rings_blue/Mask_3x.svg";
import max from "./assets/max.svg";
import up from "./assets/up-active.svg";
import down from "./assets/down-active.svg";

const AVAILABLE_NFTS = 1; // TODO: Count of NFTs
const MAX_MINT_COUNT_BY_USER = 100;
const MAX_MINT_AMOUNT = 10;
const LOCAL_STORAGE_KEY = '928e7d91-1a13-4338-bf6a-2451f50f29ee'; // TODO: New Guid


const useStateWithLocalStorage = localStorageKey => {
  const [mintedByUser, setMintedByUser] = useState(
    localStorage.getItem(localStorageKey) || 0
  );
 
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, mintedByUser);
  }, [mintedByUser]);
 
  return [mintedByUser, setMintedByUser];
};



function App() {

  const [mintAmount, setMintAmount] = useState()
  const [mintedByUser, setMintedByUser] = useStateWithLocalStorage(LOCAL_STORAGE_KEY); 
  const [ethBalance, setEthBalance] = useState('Ξ')
  const [currentAccount, setCurrentAccount] = useState('')
  const [isLogged, setIsLogged] = useState(false)

  const [modalConnectShow, setModalConnectShow] = useState(false);
  const [minted, setMinted] = useState(0);
  const [currentProvider, setProvider] = useState();

  async function getEthBalance(walletAddress) {
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider('https://eth-rinkeby.alchemyapi.io/v2/CMOYd_z9dxmUwziC8EN5iB7KKGZ56uC2'));
      var balance = await web3.eth.getBalance(walletAddress);
      console.log(web3.utils.fromWei(balance, "ether"));
      // balance = web3.toDecimal(balance);
      setEthBalance(`${parseFloat(web3.utils.fromWei(balance, "ether")).toFixed(3)} Ξ`);
    } catch {}
  }

  function decreaseMintAmount() {
      if(mintAmount > 1) {
        setMintAmount(mintAmount - 1);
      }
  }

  function increaseMintAmount() {
    if(mintAmount < MAX_MINT_AMOUNT) {
      setMintAmount(mintAmount + 1);
    }
  }

  const SignIn = useCallback(async () => {
    setMintAmount(1);
    setModalConnectShow(true);
  }, [])

  const connectEth = async (provider, isMetamask) => {
    console.log(provider)
     const web3 = new Web3(provider)

     if(!provider) {
       setMessage([{head : "Wallet not found", body: `Please install the MetaMask!`, variant: 'warning'}])
     } else {
       const address = await ConnectWallet(web3, isMetamask);
       if (!!address)
         setMessage(messages =>[...messages.filter(el => el.body !== `Address: ${address}`), {head : "You are logged in:", body: `Address: ${address}`, variant: 'success'}])
         const [supply] = await Promise.all([getTotalSupply(web3), getEthBalance(address)]);
         setMinted(supply.toString());
     }
  };

  const connectMetamask = async () => {
    console.log('Connecting metamask')

    setModalConnectShow(false)
    const provider = await detectEthereumProvider();
    setProvider(provider);
    await connectEth(provider, true);
  };

  const connectWalletC = async () => {
    console.log('Connecting wallet')
    setModalConnectShow(false)
    const provider = new WalletConnectProvider({
      infuraId: "77b1a03f653644c0abd36f7471d8293a",
    });
    try {
      await provider.enable();
      setProvider(provider);
      await connectEth(provider, false);
    } catch(e) {
      console.log(e)
    }
  };

  const ConnectWallet = async (web3, isMetamask) => {
    try {
      const accounts = isMetamask ? await window.ethereum.request({ method: 'eth_requestAccounts' }) : await web3.eth.getAccounts(); 
      setIsLogged(true)
      setCurrentAccount(accounts[0])
      return accounts[0]

    } catch(err) {
      
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.')
        setMessage(messages =>[...messages, {head : "User Rejected Request", body: 'Please connect to a MetaMask.', variant: 'info'}])

      } else if(err.code === -32002) {
        console.log('Please unlock MetaMask.')
        setMessage(messages =>[...messages, {head : "User Request Pending", body: 'Please unlock a MetaMask and try agin.', variant: 'info'}])
      } else {
        console.error(err);
        setMessage(messages =>[...messages, {head : "Error", body: err.message, variant: 'info'}])
      }
    }
  }

  const handleAccountsChanged = async (accounts) => {
    //if(!isLogged) return
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      setMessage(messages => [...messages, {head : "User Rejected Request", body: 'Please connect to MetaMask.', variant: 'info'}])
    } else if (accounts[0] !== currentAccount) {
      setCurrentAccount(accounts[0])
      await getEthBalance(accounts[0])
    }
  }

  useEffect(() => {
    window.onbeforeunload = function() { return "Prevent reload" }

    const video = document.querySelector("video");
    video.playbackRate = 0.2;

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    subscribeMintEvent((id) => {
      setMinted(`${parseInt(id) + 1}`.toString());
    })

  }, []);

  const SignOut = async () => {
    
    setIsLogged(false)
    setCurrentAccount('');
    setEthBalance('Ξ');
    try { await currentProvider.disconnect() } catch {}
    
  }

  const shortAddr = () => {
    return `${currentAccount.substr(0,6)}...${currentAccount.substring(currentAccount.length - 4, currentAccount.length)}`
  }
  const [messages, setMessage] = useState([])

  const Message = (props) => {
    const [show, setShow] = useState(true);

    const close = () => {
      setShow(false)
      setMessage(messages.filter((item, index) => index !== props.id))
    }


    if(show) {
      return (
        <Alert className="faice-alert" onClose={close} dismissible >
          <Alert.Heading>{props.head}</Alert.Heading>
          <p className="alert-faice">
            {props.body} <a target="_blank" rel="noreferrer" href={props.url} role="button" tabIndex="0" className="alert-link-faice">{props.urlText1} <img alt="" hidden={!!!props.urlText1} style={{transition: "none"}} src={openLink} className="external-link"/></a>
          </p>
          <hr hidden={!!!props.info1} />
          <p hidden={!!!props.info1} className="mb-0 faice-alert-sub">
            {props.info1} <a target="_blank" rel="noreferrer" href={props.url2} role="button" tabIndex="0" className="alert-link-faice">{props.urlText2} <img alt="" style={{transition: "none"}} src={openLink} className="external-link"/></a>
          </p>
          <p hidden={!!!props.info2} className="mb-0 faice-alert-sub">
            {props.info2}
          </p>
        </Alert>
      )
    } else {
      return(<></>)
    }

    
  }

  function ConectModal(props) {
    const {connectMetamask, connectWalletC} = props;
    return (
      <Modal
        {...props}
        className="align-items-center justify-content-center"
        aria-labelledby="contained-modal-title-vcenter"
        dialogClassName="trusted-modal"
        centered
      >
        <Modal.Body >
          <Row className="align-items-center justify-content-center h-100 row-border wallet-connect-hover" onClick={connectMetamask}>
            <Col className="align-items-center justify-content-center ">
              <Row className="align-items-center justify-content-center mt-5">
                <img alt="" style={{transition: "none"}} src={metamask} className="metamask-icon"/>
              </Row>
              <Row className="align-items-center justify-content-center mt-2">
                <div className="wallet-connect-title text-center">MetaMask</div>
              </Row>
              <Row className="align-items-center justify-content-center mb-5">
                <div className="wallet-connect-sub text-center">Connect to your MetaMask Wallet</div>
              </Row>
            </Col>
          </Row>
          <Row className="align-items-center justify-content-center h-100 wallet-connect-hover" onClick={connectWalletC} >
            <Col className="align-items-center justify-content-center ">
              <Row className="align-items-center justify-content-center mt-5">
                <img alt="" style={{transition: "none"}} src={walletConnect} className="metamask-icon"/>
              </Row>
              <Row className="align-items-center justify-content-center mt-2">
                <div className="wallet-connect-title text-center">Wallet Connect</div>
              </Row>
              <Row className="align-items-center justify-content-center mb-5">
                  <div className="wallet-connect-sub text-center">Scan with WalletConnect to connect</div>
              </Row>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    );
  }

  function Mint() {

    const web3 = new Web3(currentProvider);
    mintFaices(web3, mintAmount, currentAccount, (hash) => {
      
      setMintedByUser(parseInt(mintedByUser) + parseInt(mintAmount))
      setMessage(messages =>[...messages, {
        head : "You successfully minted your Faices!",
        url: "https://opensea.io/account",
        urlText1: "Opensea Account",
        body: `Check your wallet / `,
        nohide: true,
        variant: 'dark'
      }])
    });
  }
  
  return (
  <>
    <div className="video" class="embed-responsive embed-responsive-4by3"> 
      <video tra autoPlay loop muted style = {{
          position: "absolute",
          width: "100%",
          left: "50%",
          top: "50%",
          height: "100%",
          objectFit: "cover",
          transform: "translate(-50%, -50%)",
          opacity: "25%",
          zIndex: -1,
        }}>

        <source src={backVid} type="video/mp4" />

      </video>
    </div>
  

    <div className="message-list" >
        {
          messages.map((item,i) => (
            <Message head={item.head} 
            body={item.body} 
            variant={item.variant} id={i} key={i} url={item.url} url2={item.url2} 
            urlText1={item.urlText1}
            urlText2={item.urlText2} 
            info1={item.info1}
            info2={item.info2} 
            nohide={item.nohide} />
          ))
        }
    </div>

    <ConectModal
      show={modalConnectShow}
      connectMetamask={connectMetamask}
      connectWalletC={connectWalletC}
      onHide={() => setModalConnectShow(false)}
    />
    

    <Container>
      <Row className="justify-content-center p-5"> 
        <img alt="" className="pt-5 faices-logo" src={faicesLogo} />
      </Row>

      <Row className="headline justify-content-center pt-4">
        <div className="headline text-center">INTRODUCING AI PHOTOGRAPHY PFPs<br/>TO GENERATIVE NFT HISTORY.</div>
      </Row>
      
      <Row className="justify-content-center main-box"> 
        
        <img alt="" className="ring1" src={ring1} />
        <img alt="" className="ring2" src={ring2} />
        <img alt="" className="ring3" src={ring3} />
        <img alt="" className="ring4" src={ring4} />

        
        <Row md="auto" className="justify-content-center" hidden={isLogged}> 
          <Button className="btn btn-primary main-button" onClick={SignIn}>
            <span>Connect Wallet</span>
          </Button>{' '}
        </Row>


        <Container hidden={!(isLogged && mintedByUser >= MAX_MINT_COUNT_BY_USER && minted < AVAILABLE_NFTS)}>
          <Row className="headline justify-content-center" >
            <div className="mint-denied text-center">Thank you for your trust and enthusiasm!<br/>Please leave some for the others 🙏</div>
          </Row>

          <Row className="justify-content-center pt-5"> 
              <Button className="btn btn-primary logout-button pt-5" onClick={SignOut}>logout</Button>
          </Row>
        </Container>

        
        
        <Container hidden={!(isLogged && minted >= AVAILABLE_NFTS)}>
          
          <Row className="headline justify-content-center">
            <div className="mint-denied text-center">Thank you everybody!<br/>We are sold out 🙏</div>
            <div className="mint-denied text-center pt-3">Check out collection on 
              <a rel="noreferrer" target="_blank" href="https://opensea.io/collection/faices.io" role="button" tabIndex="0" className="alert-link-faice"> Opensea <img alt="" style={{transition: "none"}} src={openLink} className="external-link"/></a>
            </div>
          </Row>

          <Row className="justify-content-center pt-5">
            <Button className="btn btn-primary logout-button pt-5" onClick={SignOut}>logout</Button>
          </Row>
      
        </Container>
    


        <Container hidden={!(isLogged && mintedByUser < MAX_MINT_COUNT_BY_USER && minted < AVAILABLE_NFTS)}>
          <Row className="justify-content-right img-center pull-right"> 
            <Col>
              <Row>
                <Col className="col-wp mint-up-button">
                  <img alt="" class="float-end mint-up-button" src={up} onClick={(e) => { increaseMintAmount(); }}/>
                </Col>
                <Col className="col-wp down-button mint-down-button">
                  <img alt="" class="pull-md-right mint-down-button" src={down} onClick={(e) => { decreaseMintAmount(); }}/>
                </Col>
              </Row>
            </Col>
            
            <Col className="justify-content-center fixed-width-100">
              <div className="mint-count text-center">{mintAmount}</div>
            </Col>
            <Col className="img-center">
              <img className="mint-max-button" alt="" src={max} onClick={(e) => { e.preventDefault(); setMintAmount(MAX_MINT_AMOUNT); }}/>
            </Col>
          </Row>


          <Row className="headline justify-content-center pt-2">
            <div className="mint-question text-center">How many Faices NFTs do you<br/>wanna mint for 0.04 Ξ each?</div>
          </Row>
          
          <Row className="justify-content-center pt-5"> 
            <Button className="btn btn-primary main-button" type="submit" onClick={(e) => { e.preventDefault(); Mint(); }}>
              <span>Mint</span>
            </Button>{' '}
          </Row>

            
          <Row className="headline justify-content-center">
            <div className="connected-sub text-center">Connected with {shortAddr()}</div>
          </Row>
    
          <Row className="justify-content-center pt-2"> 
            <Col className="pt-5">
              <div className="balance">{ethBalance}</div>
            </Col>
                  
            <Col>
              <Button className="btn btn-primary logout-button pt-5" onClick={SignOut}>logout</Button>{' '}
            </Col>
          </Row>
        </Container>
      </Row>
    </Container> 
  </>
  );
}

export default App;
