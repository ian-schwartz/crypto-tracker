import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Exchanges = () => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/exchanges'
      );
      setExchanges(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, []);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <p className='dark:text-white'>Loading...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-6 py-24'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {exchanges.map((exchange) => (
          <div
            key={exchange.id}
            className='p-6 rounded-lg shadow-sm bg-white dark:bg-gray-800 border dark:border-gray-700 hover:shadow-lg transition-shadow'
          >
            <img
              src={exchange.image}
              alt={exchange.name}
              className='h-16 w-16 mx-auto mb-4'
            />
            <h2 className='text-xl font-semibold text-center text-gray-900 dark:text-white'>
              {exchange.name}
            </h2>
            <p className='text-center mt-2 text-gray-600 dark:text-gray-400'>
              Country: {exchange.country || 'N/A'}
            </p>
            <p className='text-center text-gray-600 dark:text-gray-400'>
              24h Volume: {exchange.trade_volume_24h_btc.toLocaleString()} BTC
            </p>
            <a
              href={exchange.url}
              target='_blank'
              rel='noopener noreferrer'
              className='block mt-2 text-center text-indigo-500 hover:underline'
            >
              Visit Exchange
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Exchanges;
