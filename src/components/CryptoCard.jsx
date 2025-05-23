import React from 'react';
import { useNavigate } from 'react-router-dom';

const formatPrice = (price) => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });

  if (price >= 1) return `$${formatter.format(price.toFixed(2))}`;
  if (price >= 0.01) return `$${formatter.format(price.toFixed(4))}`;
  return `$${formatter.format(price.toFixed(8))}`;
};

const CryptoCard = ({ crypto, livePrice }) => {
  const navigate = useNavigate();
  const percentChange = crypto.price_change_percentage_24h;

  const handleClick = () => {
    console.log('Crypto data being passed:', crypto);
    console.log('Navigating to:', `/crypto/${crypto.id}`);
    navigate(`/crypto/${crypto.id}`);
  };

  return (
    <div 
      className='p-6 rounded-lg shadow-sm bg-white dark:bg-gray-800 border dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer'
      onClick={handleClick}
    >
      <img
        src={crypto.image}
        alt={crypto.name}
        className='h-16 w-16 mx-auto mb-4'
      />
      <h2 className='text-xl font-semibold text-center text-gray-900 dark:text-white'>
        {crypto.name}
      </h2>
      <p className='text-center text-gray-600 dark:text-gray-400'>
        {crypto.symbol.toUpperCase()}
      </p>
      <p className='text-center text-lg font-bold text-green-500 mt-2'>
        {formatPrice(livePrice)}
      </p>
      <p
        className={`text-center mt-2 ${
          percentChange > 0 ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {percentChange !== null ? `${percentChange.toFixed(2)}% (24h)` : 'N/A'}
      </p>
    </div>
  );
};

export default CryptoCard;
