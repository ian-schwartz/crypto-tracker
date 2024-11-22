import React from 'react';

const formatNumber = (number) => {
  if (number === undefined || number === null) return 'N/A';
  if (number >= 1e12) return `${(number / 1e12).toFixed(1)}T`;
  if (number >= 1e9) return `${(number / 1e9).toFixed(1)}B`;
  if (number >= 1e6) return `${(number / 1e6).toFixed(1)}M`;
  if (number >= 1e3) return `${(number / 1e3).toFixed(1)}K`;
  return number.toString();
};

const MarketSummary = ({ marketSummary }) => {
  return (
    <div className='mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold text-center text-gray-900 dark:text-white mb-4'>
        Market Overview
      </h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400'>Total Market Cap</p>
          <p className='text-lg font-semibold text-green-500'>
            {formatNumber(marketSummary.total_market_cap?.usd) || 'N/A'}
          </p>
        </div>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400'>24h Volume</p>
          <p className='text-lg font-semibold text-indigo-500'>
            {formatNumber(marketSummary.total_volume?.usd) || 'N/A'}
          </p>
        </div>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400'>BTC Dominance</p>
          <p className='text-lg font-semibold text-yellow-500'>
            {marketSummary.market_cap_percentage?.btc.toFixed(2) || 'N/A'}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketSummary;
