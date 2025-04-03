import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CryptoList from './CryptoList';
import Pagination from './Pagination';
import MarketSummary from './MarketSummary';

const Main = ({ currentPage, setCurrentPage }) => {
  const [cryptos, setCryptos] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [marketSummary, setMarketSummary] = useState({});

  const ITEMS_PER_PAGE = 32;
  const TOTAL_ITEMS = 96;

  const fetchMarketSummary = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/global'
      );
      setMarketSummary(response.data.data);
    } catch (error) {
      console.error('Error fetching market summary:', error);
    }
  };

  useEffect(() => {
    fetchMarketSummary();
  }, []);

  useEffect(() => {
    const fetchCryptos = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/coins/markets',
          {
            params: {
              vs_currency: 'usd',
              order: 'market_cap_desc',
              per_page: ITEMS_PER_PAGE,
              page: currentPage,
              sparkline: false,
            },
          }
        );

        const dataWithIds = response.data.map((crypto) => ({
          ...crypto,
          id: `${crypto.symbol.toUpperCase()}-USD`,
        }));

        setCryptos(dataWithIds);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cryptocurrencies:', error);
        setLoading(false);
      }
    };

    fetchCryptos();
  }, [currentPage]);

  useEffect(() => {
    if (!cryptos.length) return;

    const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          channels: [
            {
              name: 'ticker',
              product_ids: cryptos.map((crypto) => crypto.id),
            },
          ],
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ticker') {
        setPrices((prev) => ({
          ...prev,
          [data.product_id]: {
            price: parseFloat(data.price),
          },
        }));
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = (event) => console.log('WebSocket disconnected', event.reason);

    return () => {
      ws.close();
    };
  }, [cryptos]);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <p className='dark:text-white'>Loading...</p>
      </div>
    );
  }

  const handlePageChange = (direction) => {
    setCurrentPage((prevPage) =>
      direction === 'next' ? prevPage + 1 : prevPage - 1
    );
  };

  return (
    <div className='container mx-auto px-6 py-24'>
      <MarketSummary marketSummary={marketSummary} />
      <CryptoList cryptos={cryptos} prices={prices} />
      <Pagination
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        totalPages={TOTAL_ITEMS / ITEMS_PER_PAGE}
      />
    </div>
  );
};

export default Main;
