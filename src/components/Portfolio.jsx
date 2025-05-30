import React, { useState, useEffect } from 'react';
import AddCryptoModal from './AddCryptoModal';
import EditCryptoModal from './EditCryptoModal';
import axios from 'axios';

const CACHE_DURATION = 60000; // Cache prices for 1 minute
const RETRY_DELAY = 5000; // Wait 5 seconds between retries
const MAX_RETRIES = 3;

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [displayMode, setDisplayMode] = useState({
    '24h': 'percentage', // 'percentage' or 'usd'
    'allTime': 'percentage'
  });

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

  // Function to fetch current prices for holdings
  const fetchCurrentPortfolioData = async () => {
    if (holdings.length === 0) return;

    // Check if we should use cached data
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION && Object.keys(currentPrices).length > 0) {
      return; // Use cached data
    }

    setIsLoadingPrices(true);
    setPriceFetchError(null);
    const ids = holdings.map(holding => holding.id).join(',');
    
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            ids: ids,
            price_change_percentage: '24h'
          }
        }
      );
      const prices = response.data.reduce((acc, coin) => {
        acc[coin.id] = { 
          usd: coin.current_price, 
          price_change_percentage_24h: coin.price_change_percentage_24h 
        };
        return acc;
      }, {});
      setCurrentPrices(prices);
      setLastFetchTime(now);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error fetching current prices:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchCurrentPortfolioData();
        }, RETRY_DELAY * retryCount); // Exponential backoff
        return;
      }
      
      setPriceFetchError('Failed to fetch current prices. Please try again later.');
      setCurrentPrices({});
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Effect to trigger initial data fetch when holdings change
  useEffect(() => {
    fetchCurrentPortfolioData();
  }, [holdings]);

  // Add periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentPortfolioData();
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, []);

  const handleAddCrypto = (newHolding) => {
    // Add a unique identifier to the holding
    const holdingWithId = {
      ...newHolding,
      holdingId: `${newHolding.id}-${Date.now()}` // Create unique ID using timestamp
    };
    setHoldings([...holdings, holdingWithId]);

    // Add the current price to our prices state immediately
    setCurrentPrices(prev => ({
      ...prev,
      [newHolding.id]: {
        usd: newHolding.purchasePrice, // Use the purchase price as initial current price
        price_change_percentage_24h: 0 // We don't have 24h change yet
      }
    }));
  };

  const handleRemoveCrypto = (holdingId, name) => {
    const holding = holdings.find(h => h.holdingId === holdingId);
    const confirmMessage = `Are you sure you want to remove this ${name} purchase (${holding.amount} ${holding.symbol.toUpperCase()}, bought on ${formatDate(holding.purchaseDate)}) from your portfolio?`;
    
    if (window.confirm(confirmMessage)) {
      setHoldings(holdings.filter(holding => holding.holdingId !== holdingId));
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
    if (!currentPriceData) return null;

    const currentPrice = currentPriceData.usd;
    const purchasePrice = holding.purchasePrice; // Use the stored historical price
    const currentValue = holding.amount * currentPrice;
    const purchaseValue = holding.amount * purchasePrice;

    const profitLoss = currentValue - purchaseValue;
    const percentageChange = (profitLoss / purchaseValue) * 100;

    return {
      amount: profitLoss,
      percentage: percentageChange
    };
  };

  const handleEditCrypto = (updatedHolding) => {
    setHoldings(holdings.map(holding => 
      holding.holdingId === updatedHolding.holdingId ? updatedHolding : holding
    ));
  };

  const calculatePortfolioPerformance = () => {
    if (holdings.length === 0) return null;

    const totalPurchaseValue = holdings.reduce((sum, holding) => {
      return sum + (holding.amount * holding.purchasePrice);
    }, 0);

    const totalCurrentValue = holdings.reduce((sum, holding) => {
      const currentPrice = currentPrices[holding.id]?.usd;
      if (currentPrice) {
        return sum + (holding.amount * currentPrice);
      }
      return sum + (holding.amount * holding.purchasePrice); // Fallback to purchase price if current price not available
    }, 0);

    // Check for valid numbers
    if (isNaN(totalPurchaseValue) || isNaN(totalCurrentValue) || totalPurchaseValue === 0) {
      return null;
    }

    const profitLoss = totalCurrentValue - totalPurchaseValue;
    const percentageChange = (profitLoss / totalPurchaseValue) * 100;

    // Check for valid results
    if (isNaN(profitLoss) || isNaN(percentageChange)) {
      return null;
    }

    return {
      amount: profitLoss,
      percentage: percentageChange
    };
  };

  const toggleDisplayMode = (metric) => {
    setDisplayMode(prev => ({
      ...prev,
      [metric]: prev[metric] === 'percentage' ? 'usd' : 'percentage'
    }));
  };

  const formatValue = (value, isPercentage) => {
    if (isPercentage) {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    return `${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div>
      <div className="container mx-auto px-4 py-24">
        <div className="flex justify-center mb-8 pt-0">
          <div className="w-full max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Portfolio Value
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {isLoadingPrices && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  const performance = calculatePortfolioPerformance();
                  return (
                    <>
                      <div 
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => toggleDisplayMode('24h')}
                      >
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">24h Change</p>
                        {portfolio24hChange !== null ? (
                          <div className="flex items-baseline gap-2">
                            <p className={`text-xl font-semibold ${portfolio24hChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {displayMode['24h'] === 'percentage' 
                                ? formatValue(portfolio24hChange, true)
                                : formatValue(portfolio24hChange * totalValue / 100, false)
                              }
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {portfolio24hChange >= 0 ? '↑' : '↓'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500">---</p>
                        )}
                      </div>

                      <div 
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => toggleDisplayMode('allTime')}
                      >
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">All Time</p>
                        {performance ? (
                          <div className="flex items-baseline gap-2">
                            <p className={`text-xl font-semibold ${performance.percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {displayMode['allTime'] === 'percentage'
                                ? formatValue(performance.percentage, true)
                                : formatValue(performance.amount, false)
                              }
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {performance.percentage >= 0 ? '↑' : '↓'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500">---</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {performance && !isNaN(performance.amount) && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click on either card to toggle between percentage and USD values
                  </p>
                </div>
              )}

              {priceFetchError && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-4 text-center">{priceFetchError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8">
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
                            {currentPrice ? 
                              `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                              isLoadingPrices ? 'Loading...' : '---'
                            }
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
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => {
                                  setSelectedHolding(holding);
                                  setIsEditModalOpen(true);
                                }}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveCrypto(holding.holdingId, holding.name)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <AddCryptoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddCrypto}
        />

        <EditCryptoModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedHolding(null);
          }}
          onEdit={handleEditCrypto}
          holding={selectedHolding}
        />
      </div>
    </div>
  );
};

export default Portfolio; 