import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import CryptoList from './CryptoList';
import Pagination from './Pagination';
import MarketSummary from './MarketSummary';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_VERSION = '1.0';

const Main = ({ currentPage, setCurrentPage }) => {
  const [cryptos, setCryptos] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [marketSummary, setMarketSummary] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastFetchRef = useRef({
    marketSummary: 0,
    cryptos: 0
  });

  const ITEMS_PER_PAGE = 32;
  const TOTAL_ITEMS = 96;

  const getCachedData = (key) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp, version } = JSON.parse(cached);
      if (version !== CACHE_VERSION) return null;
      if (Date.now() - timestamp > CACHE_DURATION) return null;
      
      return data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  const setCachedData = (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  };

  const fetchMarketSummary = async () => {
    const now = Date.now();
    const cachedData = getCachedData('marketSummary');
    
    if (cachedData) {
      setMarketSummary(cachedData);
      lastFetchRef.current.marketSummary = now;
      return;
    }

    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/global'
      );
      const data = response.data.data;
      setMarketSummary(data);
      setCachedData('marketSummary', data);
      lastFetchRef.current.marketSummary = now;
    } catch (error) {
      console.error('Error fetching market summary:', error);
    }
  };

  useEffect(() => {
    fetchMarketSummary();
    const interval = setInterval(fetchMarketSummary, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCryptos = async () => {
      const now = Date.now();
      const cachedData = getCachedData(`cryptos_page_${currentPage}`);
      
      if (cachedData) {
        setCryptos(cachedData);
        lastFetchRef.current.cryptos = now;
        setLoading(false);
        return;
      }

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

        const data = response.data;
        setCryptos(data);
        setCachedData(`cryptos_page_${currentPage}`, data);
        lastFetchRef.current.cryptos = now;
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cryptocurrencies:', error);
        setLoading(false);
      }
    };

    fetchCryptos();
  }, [currentPage]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    wsRef.current = ws;

    ws.onopen = () => {
      const productIds = cryptos.map((crypto) => `${crypto.symbol.toUpperCase()}-USD`);
      const subscribeMessage = {
        type: 'subscribe',
        channels: [
          {
            name: 'ticker',
            product_ids: productIds,
          },
        ],
      };
      ws.send(JSON.stringify(subscribeMessage));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ticker') {
        setPrices((prev) => ({
          ...prev,
          [data.product_id]: {
            price: parseFloat(data.price),
            lastUpdate: new Date().toISOString(),
          },
        }));
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    };

    ws.onclose = (event) => {
      console.error('WebSocket disconnected:', event.reason);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    };
  };

  useEffect(() => {
    if (!cryptos.length) return;

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [cryptos]);

  if (loading && !cryptos.length) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className='dark:text-white'>Loading cryptocurrency data...</p>
        </div>
      </div>
    );
  }

  // Revert totalPages calculation to use TOTAL_ITEMS and ITEMS_PER_PAGE
  const totalPages = Math.ceil(TOTAL_ITEMS / ITEMS_PER_PAGE);

  const handlePageChange = (direction) => {
    if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <MarketSummary summary={marketSummary} />
      <CryptoList cryptos={cryptos} prices={prices} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
      />
    </div>
  );
};

export default Main;
