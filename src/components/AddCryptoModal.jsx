import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const AddCryptoModal = ({ isOpen, onClose, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [dollarValue, setDollarValue] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [inputMode, setInputMode] = useState('crypto'); // 'crypto' or 'dollar'
  const [purchaseDate, setPurchaseDate] = useState(new Date());

  useEffect(() => {
    const searchCryptos = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      // Rate limiting: Only search if 2 seconds have passed since last search
      const now = Date.now();
      if (now - lastSearchTime < 2000) {
        return;
      }
      setLastSearchTime(now);

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/search',
          {
            params: {
              query: searchTerm
            }
          }
        );
        setSearchResults(response.data.coins.slice(0, 5));
      } catch (error) {
        console.error('Error searching cryptocurrencies:', error);
        if (error.response?.status === 429) {
          setError('Rate limit exceeded. Please wait a moment before searching again.');
        } else {
          setError('Failed to search cryptocurrencies. Please try again.');
        }
        setSearchResults([]);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(searchCryptos, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, lastSearchTime]);

  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (!selectedCrypto) return;

      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price`,
          {
            params: {
              ids: selectedCrypto.id,
              vs_currencies: 'usd'
            }
          }
        );
        const price = response.data[selectedCrypto.id].usd;
        setCurrentPrice(price);
      } catch (error) {
        console.error('Error fetching price:', error);
        setError('Failed to fetch current price');
      }
    };

    fetchCurrentPrice();
  }, [selectedCrypto]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      setAmount(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setAmount(cleanValue);
    }

    // Update dollar value if in crypto mode
    if (inputMode === 'crypto' && currentPrice) {
      const cryptoAmount = parseFloat(cleanValue) || 0;
      setDollarValue((cryptoAmount * currentPrice).toFixed(2));
    }
  };

  const handleDollarValueChange = (e) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      setDollarValue(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setDollarValue(cleanValue);
    }

    // Update crypto amount if in dollar mode
    if (inputMode === 'dollar' && currentPrice) {
      const dollarAmount = parseFloat(cleanValue) || 0;
      setAmount((dollarAmount / currentPrice).toFixed(8));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCrypto || (!amount && !dollarValue)) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    onAdd({
      id: selectedCrypto.id,
      name: selectedCrypto.name,
      symbol: selectedCrypto.symbol,
      image: selectedCrypto.thumb,
      amount: numericAmount,
      value: numericAmount * currentPrice,
      purchaseDate: purchaseDate.toISOString()
    });

    // Reset form
    setSearchTerm('');
    setAmount('');
    setDollarValue('');
    setSelectedCrypto(null);
    setError(null);
    setPurchaseDate(new Date());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Cryptocurrency
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Cryptocurrency
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Search by name or symbol..."
            />
            {loading && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Searching...</p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
            {selectedCrypto && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center">
                  <img
                    src={selectedCrypto.thumb}
                    alt={selectedCrypto.name}
                    className="w-6 h-6 mr-2"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {selectedCrypto.name} ({selectedCrypto.symbol.toUpperCase()})
                    </span>
                    {currentPrice && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current Price: ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCrypto(null)}
                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {searchResults.length > 0 && !selectedCrypto && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                {searchResults.map((crypto) => (
                  <button
                    key={crypto.id}
                    type="button"
                    onClick={() => setSelectedCrypto(crypto)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <img
                      src={crypto.thumb}
                      alt={crypto.name}
                      className="w-6 h-6 mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">{crypto.name}</span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      ({crypto.symbol.toUpperCase()})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCrypto && (
            <>
              <div className="mb-4">
                <div className="flex space-x-4 mb-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('crypto')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                      inputMode === 'crypto'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Amount in {selectedCrypto.symbol.toUpperCase()}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('dollar')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                      inputMode === 'dollar'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Amount in USD
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={inputMode === 'crypto' ? amount : dollarValue}
                    onChange={inputMode === 'crypto' ? handleAmountChange : handleDollarValueChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={`Enter amount in ${inputMode === 'crypto' ? selectedCrypto.symbol.toUpperCase() : 'USD'}...`}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">
                      {inputMode === 'crypto' ? selectedCrypto.symbol.toUpperCase() : 'USD'}
                    </span>
                  </div>
                </div>

                {inputMode === 'crypto' && dollarValue && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    ≈ ${parseFloat(dollarValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                {inputMode === 'dollar' && amount && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    ≈ {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })} {selectedCrypto.symbol.toUpperCase()}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Date
                </label>
                <DatePicker
                  selected={purchaseDate}
                  onChange={date => setPurchaseDate(date)}
                  maxDate={new Date()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  dateFormat="MMMM d, yyyy"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedCrypto || (!amount && !dollarValue)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCryptoModal; 