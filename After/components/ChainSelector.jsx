import React from 'react';

const ChainSelector = () => {
  return (
    <div className="chain_selector">
title={"Switch Token Chain"}
        openChainSelector={openChainSelector}
        setOpenChainSelector={setOpenChainSelector}
        chains={receiveChains}
        selectedChain={suppliesChain}
        setSelectedChain={setSuppliesChain}    
        </div>
  );
};

export default ChainSelector;
