import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useWallet, useChainSelector, useAppSupplies, useAppToast } from './hooks';
import { CoinGeckoApi, ChainScanner } from './services'; 
import { Contract } from 'ethers'; 
import { parseEther } from 'ethers/lib/utils'; 
import { BurnButtonBar } from './components/BurnButtonBar';
import { BurnStatsContainer } from './components/BurnStatsContainer'; 
import { TransactionTable } from './components/TransactionTable'; 
import { ChainSelector } from './components/ChainSelector'; 
import { AppToastComponent } from './components/AppToastComponent';

const DashboardLayoutStyled = styled.div`
  /* Add your styles here */
`;

enum BurnTxProgress {
  default = "Burn App Tokens",
  burning = "Burning...",
}

// BurnPage component
const BurnPage = () => {
  // Custom hooks
  const {
    walletAddress,
    isWalletConnected,
    walletBalance,
    isBalanceError,
    openChainModal,
    walletChain,
    chains,
    openConnectModal,
  } = useWallet();
  const { openChainSelector, setOpenChainSelector, openChainSelectorModal } =
    useChainSelector();
  const { chains: receiveChains } = useWallet();
  const {
    supplies,
    allSupplies,
    setSuppliesChain,
    suppliesChain,
    fetchSupplies,
  } = useAppSupplies(true);
  const { toastMsg, toastSev, showToast } = useAppToast();

  const [burnTransactions, setBurnTransactions] = useState<any[]>([]);
  const [isOldToken, setIsOldToken] = useState(false);
  const [burnAmount, setBurnAmount] = useState("");
  const [coinData, setCoinData] = useState<any>({});
  const [txButton, setTxButton] = useState<BurnTxProgress>(
    BurnTxProgress.default
  );
  const [txProgress, setTxProgress] = useState<boolean>(false);
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null);
  const [burnTxHash, setBurnTxHash] = useState<string | null>(null);

  useEffect(() => {
    CoinGeckoApi.fetchCoinData()
      .then((data: any) => {
        setCoinData(data?.market_data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  // Function to handle change in burn amount input
  const onChangeBurnAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") setBurnAmount("");
    if (isNaN(parseFloat(e.target.value))) return;
    setBurnAmount(e.target.value);
  };

  // Function to refetch burn transactions
  const refetchTransactions = () => {
    Promise.all(
      ChainScanner.fetchAllTxPromises(isChainTestnet(walletChain?.id))
    )
      .then((results: any) => {
        let res = results.flat();
        res = ChainScanner.sortOnlyBurnTransactions(res);
        res = res.sort((a: any, b: any) => b.timeStamp - a.timeStamp);
        setBurnTransactions(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // Function to execute burn
  const executeBurn = async () => {
    if (!isWalletConnected) {
      openConnectModal();
    }
    if (burnAmount === "") {
      showToast("Enter amount to migrate", ToastSeverity.warning);
      return;
    }
    const newTokenAddress = fetchAddressForChain(walletChain?.id, "newToken");
    const oftTokenContract = new Contract(
      newTokenAddress,
      oftAbi,
      ethersSigner
    );
    let amount = parseEther(burnAmount);
    setTxButton(BurnTxProgress.burning);
    setTxProgress(true);
    try {
      const burnTx = await oftTokenContract.burn(amount);
      setBurnTxHash(burnTx.hash);
      await burnTx.wait();
      setTxButton(BurnTxProgress.default);
      setTxProgress(false);
      refetchTransactions();
      fetchSupplies();
    } catch (err) {
      console.log(err);
      setTxButton(BurnTxProgress.default);
      setTxProgress(false);
      showToast("Burn Failed!", ToastSeverity.error);
    }
  };

  useEffect(() => {
    if (!walletChain) return;
    let isSubscribed = true;
    if (isSubscribed) setBurnTransactions([]);
    const isTestnet = isChainTestnet(walletChain?.id);
    let _chainObjects: any[] = [mainnet, avalanche, fantom];
    if (isTestnet) _chainObjects = [sepolia, avalancheFuji, fantomTestnet];
    Promise.all(ChainScanner.fetchAllTxPromises(isTestnet))
      .then((results: any) => {
        if (isSubscribed) {
          let new_chain_results: any[] = [];
          results.forEach((results_a: any[], index: number) => {
            new_chain_results.push(
              results_a.map((tx: any) => ({
                ...tx,
                chain: _chainObjects[index],
              }))
            );
          });
          let res = new_chain_results.flat();
          res = ChainScanner.sortOnlyBurnTransactions(res);
          res = res.sort((a: any, b: any) => b.timeStamp - a.timeStamp);
          setBurnTransactions(res);
        }
      })
      .catch((err) => {
        console.log(err);
      });
    return () => {
      isSubscribed = false;
    };
  }, [walletChain, isOldToken]);

  return (
    <DashboardLayoutStyled className="burnpage">
      <div className="top_conatiner burnpage" style={{ alignItems: "flex-start" }}>
        
        <BurnButtonBar 
          burnAmount={burnAmount} 
          onChangeBurnAmount={onChangeBurnAmount}
          executeBurn={executeBurn}
          txButton={txButton}
          txProgress={txProgress}
          burnTxHash={burnTxHash}
          walletChain={walletChain}
        />

        <BurnStatsContainer 
          statsSupplies={supplies} 
          tokenAddress={fetchAddressForChain(suppliesChain?.id, isOldToken ? "oldToken" : "newToken")}
          coinData={coinData}
        />
      </div>

      <TransactionTable 
        burnTransactions={burnTransactions} 
        priceUSD={coinData?.current_price?.usd}
      />

<ChainSelector 
        title={"Switch Token Chain"}
        openChainSelector={openChainSelector}
        setOpenChainSelector={setOpenChainSelector}
        chains={receiveChains}
        selectedChain={suppliesChain}
        setSelectedChain={setSuppliesChain}
      />

      <AppToastComponent 
        position={{ vertical: "bottom", horizontal: "center" }}
        message={toastMsg}
        severity={toastSev}
      />
      
    </DashboardLayoutStyled>
  );
};

export default BurnPage;
