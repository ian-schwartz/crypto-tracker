import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_VERSION = '1.0';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CryptoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cryptoData, setCryptoData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const lastFetchRef = useRef({
    cryptoData: 0,
    priceHistory: 0
  });

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

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

  useEffect(() => {
    const fetchWithRetry = async (url, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          if (i > 0) {
            await delay(2000 * i);
          }

          const response = await fetch(url);
          
          if (response.status === 429) {
            continue;
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        } catch (error) {
          if (i === retries - 1) throw error;
        }
      }
    };

    const fetchCryptoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const now = Date.now();
        const cachedCryptoData = getCachedData(`crypto_${id}`);
        const cachedPriceHistory = getCachedData(`history_${id}`);
        
        let shouldFetchData = !cachedCryptoData;
        let shouldFetchHistory = !cachedPriceHistory;

        if (cachedCryptoData) {
          setCryptoData(cachedCryptoData);
          lastFetchRef.current.cryptoData = now;
        }

        if (cachedPriceHistory) {
          setPriceHistory(cachedPriceHistory);
          lastFetchRef.current.priceHistory = now;
        }

        if (!shouldFetchData && !shouldFetchHistory) {
          setLoading(false);
          return;
        }

        await delay(2000);
        
        if (shouldFetchData) {
          const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
          const data = await fetchWithRetry(url);
          setCryptoData(data);
          setCachedData(`crypto_${id}`, data);
          lastFetchRef.current.cryptoData = now;
        }

        await delay(3000);

        if (shouldFetchHistory) {
          const historyUrl = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`;
          const historyData = await fetchWithRetry(historyUrl);
          setPriceHistory(historyData.prices);
          setCachedData(`history_${id}`, historyData.prices);
          lastFetchRef.current.priceHistory = now;
        }
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, [id]);

  if (loading && !cryptoData) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading cryptocurrency data...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few moments due to API rate limits</p>
        </div>
      </div>
    );
  }

  if (error && !cryptoData) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            If you're seeing rate limit errors, please wait a few minutes and try again.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: priceHistory.map((price) => 
      new Date(price[0]).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Price (USD)',
        data: priceHistory.map((price) => price[1]),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? 'white' : 'black'
        }
      },
      title: {
        display: true,
        text: '7-Day Price History',
        color: isDarkMode ? 'white' : 'black'
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? 'white' : 'black'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        ticks: {
          color: isDarkMode ? 'white' : 'black'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          {cryptoData.image && (
            <img
              src={cryptoData.image.large}
              alt={cryptoData.name}
              className="w-16 h-16"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {cryptoData.name} ({cryptoData.symbol.toUpperCase()})
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Rank #{cryptoData.market_cap_rank}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Price Information
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                Current Price: ${cryptoData.market_data.current_price.usd.toLocaleString()}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                24h High: ${cryptoData.market_data.high_24h.usd.toLocaleString()}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                24h Low: ${cryptoData.market_data.low_24h.usd.toLocaleString()}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                24h Volume: ${cryptoData.market_data.total_volume.usd.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Market Data
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                Market Cap: ${cryptoData.market_data.market_cap.usd.toLocaleString()}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Circulating Supply: {cryptoData.market_data.circulating_supply.toLocaleString()} {cryptoData.symbol.toUpperCase()}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Total Supply: {cryptoData.market_data.total_supply?.toLocaleString() || 'N/A'} {cryptoData.symbol.toUpperCase()}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Max Supply: {cryptoData.market_data.max_supply?.toLocaleString() || 'N/A'} {cryptoData.symbol.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default CryptoDetail; 