import React from 'react';
import CryptoCard from './CryptoCard';

const CryptoList = ({ cryptos, prices }) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
      {cryptos.map((crypto) => {
        const livePrice = prices[crypto.id]?.price || crypto.current_price;
        return <CryptoCard key={crypto.id} crypto={crypto} livePrice={livePrice} />;
      })}
    </div>
  );
};

export default CryptoList;
