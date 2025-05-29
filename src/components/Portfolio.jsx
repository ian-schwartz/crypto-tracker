import React, { useState, useEffect } from 'react';
import AddCryptoModal from './AddCryptoModal';
import axios from 'axios';

const Portfolio = () => {
  // Initialize state by trying to load from localStorage immediately
  const [holdings, setHoldings] = useState(() => {
    const savedHoldings = localStorage.getItem('portfolio');
    if (savedHoldings) {
      try {
        const parsedHoldings = JSON.parse(savedHoldings);
        return parsedHoldings;
      } catch (error) {
        console.error("Failed to parse portfolio data from localStorage during initialization:", error);
        return []; // Return empty array if parsing fails
      }
    } else {
      return []; // Return empty array if no data found
    }
  });

  const [totalValue, setTotalValue] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPrices, setCurrentPrices] = useState({}); // State to store current prices
  const [portfolio24hChange, setPortfolio24hChange] = useState(null); // State for total portfolio 24h change
  const [isLoadingPrices, setIsLoadingPrices] = useState(false); // Loading state for prices
  const [priceFetchError, setPriceFetchError] = useState(null); // Error state for price fetching

  // Save portfolio data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(holdings));
    // Recalculate total value based on *current* prices when holdings or currentPrices change
    const newTotalValue = holdings.reduce((sum, holding) => {
      const currentPrice = currentPrices[holding.id]?.usd;
      if (currentPrice) {
        return sum + (holding.amount * currentPrice);
      } else {
        // Use the saved value if current price is not available yet
        return sum + holding.value; // NOTE: This might not be ideal if price fetching fails persistently
      }
    }, 0);
    setTotalValue(newTotalValue);

    // Calculate total portfolio 24h change
    if (holdings.length > 0 && Object.keys(currentPrices).length > 0) {
      let totalValue24hAgo = 0;
      let currentTotal = 0;

      holdings.forEach(holding => {
        const currentPriceData = currentPrices[holding.id];
        if (currentPriceData) {
          const currentPrice = currentPriceData.usd;
          const priceChange24h = currentPriceData.price_change_percentage_24h;

          if (currentPrice !== undefined && priceChange24h !== undefined) {
            currentTotal += holding.amount * currentPrice;
            // Calculate price 24h ago: currentPrice / (1 + change_percentage/100)
            // Be careful with 0% change or division by zero if change_percentage_24h is -100
            const priceYesterday = currentPrice / (1 + (priceChange24h / 100));
            totalValue24hAgo += holding.amount * priceYesterday;
          }
        }
      });

      if (totalValue24hAgo > 0) {
         const change = ((currentTotal - totalValue24hAgo) / totalValue24hAgo) * 100;
         setPortfolio24hChange(change);
      } else {
        setPortfolio24hChange(0);
      }
    }

  }, [holdings, currentPrices]); // Depend on holdings and currentPrices

  // Effect to fetch current prices for holdings
  useEffect(() => {
    if (holdings.length > 0) {
      setIsLoadingPrices(true);
      setPriceFetchError(null);
      const ids = holdings.map(holding => holding.id).join(',');
      axios.get(
        `https://api.coingecko.com/api/v3/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            ids: ids,
            price_change_percentage: '24h'
          }
        }
      )
      .then(response => {
        const prices = response.data.reduce((acc, coin) => {
          acc[coin.id] = { usd: coin.current_price, price_change_percentage_24h: coin.price_change_percentage_24h };
          return acc;
        }, {});
        setCurrentPrices(prices);
        setIsLoadingPrices(false);
      })
      .catch(error => {
        console.error('Error fetching current prices:', error);
        setPriceFetchError('Failed to fetch current prices.');
        setIsLoadingPrices(false);
        setCurrentPrices({}); // Clear prices on error to indicate data might be stale
      });
    } else {
      setCurrentPrices({}); // Clear prices if holdings are empty
      setPortfolio24hChange(null); // Reset 24h change
    }
  }, [holdings]); // Depend on holdings to refetch when portfolio changes

  const handleAddCrypto = (newHolding) => {
    setHoldings([...holdings, newHolding]);
  };

  const handleRemoveCrypto = (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from your portfolio?`)) {
      setHoldings(holdings.filter(holding => holding.id !== id));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateProfitLoss = (holding) => {
    const currentPriceData = currentPrices[holding.id];
    if (!currentPriceData) return null; // Cannot calculate without current price

    const currentPrice = currentPriceData.usd;
    const purchaseValue = holding.value; // Value at purchase time
    const currentValue = holding.amount * currentPrice;

    const profitLoss = currentValue - purchaseValue;
    const percentageChange = (profitLoss / purchaseValue) * 100;

    return {
      amount: profitLoss,
      percentage: percentageChange
    };
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex justify-center mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Total Value
          </h1>
          <p className="text-4xl font-bold text-blue-500 mb-4">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {isLoadingPrices && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Loading prices...</span>}
            {priceFetchError && <span className="text-sm text-red-500 dark:text-red-400 ml-2">{priceFetchError}</span>}
          </p>
          {portfolio24hChange !== null && ( // Display 24h change if available
            <p className={`text-lg font-semibold ${portfolio24hChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              24h Change: {portfolio24hChange >= 0 ? '+' : ''}{portfolio24hChange.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Your portfolio is empty. Add some cryptocurrencies to get started!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Cryptocurrency
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Cryptocurrency
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Purchase Date
                  </th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    P/L (USD)
                  </th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    P/L (%)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {holdings.map((holding) => {
                  const currentPriceData = currentPrices[holding.id];
                  const currentPrice = currentPriceData?.usd;
                  const profitLoss = calculateProfitLoss(holding);

                  return (
                    <tr key={holding.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={holding.image}
                            alt={holding.name}
                            className="h-8 w-8 rounded-full mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {holding.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {holding.symbol.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                        {holding.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                        {currentPrice ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                        {holding.purchaseDate ? formatDate(holding.purchaseDate) : 'N/A'}
                      </td>
                       <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${profitLoss ? (profitLoss.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'}`}>
                        {profitLoss ? `${profitLoss.amount >= 0 ? '+' : '-'}$${Math.abs(profitLoss.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'}
                      </td>
                       <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${profitLoss ? (profitLoss.percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'}`}>
                        {profitLoss ? `${profitLoss.percentage >= 0 ? '+' : ''}${profitLoss.percentage.toFixed(2)}%` : '---'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleRemoveCrypto(holding.id, holding.name)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddCryptoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCrypto}
      />
    </div>
  );
};

export default Portfolio; 