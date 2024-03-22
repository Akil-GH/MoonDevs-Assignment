import React from 'react';

const TransactionTable = () => {
  return (
    <div className="transaction_table">
<div className="header">
          <p className="header_label">Burn Transactions</p>
        </div>
        <BurnTxTable
          data={burnTransactions}
          priceUSD={coinData?.current_price?.usd}
        />    
        </div>
  );
};

export default TransactionTable;