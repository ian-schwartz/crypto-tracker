import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const EditCryptoModal = ({ isOpen, onClose, onEdit, holding }) => {
  const [amount, setAmount] = useState('');
  const [dollarValue, setDollarValue] = useState('');
  const [error, setError] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [inputMode, setInputMode] = useState('crypto'); // 'crypto' or 'dollar'
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [manualPrice, setManualPrice] = useState('');

  // Initialize form with holding data
  useEffect(() => {
    if (holding) {
      setAmount(holding.amount.toString());
      setDollarValue((holding.amount * holding.purchasePrice).toString());
      setPurchaseDate(new Date(holding.purchaseDate));
      setManualPrice(holding.purchasePrice.toString());
    }
  }, [holding]);

  // Fetch current price when modal opens
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (!holding) return;
      
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price`,
          {
            params: {
              ids: holding.id,
              vs_currencies: 'usd'
            }
          }
        );
        const price = response.data[holding.id].usd;
        setCurrentPrice(price);
      } catch (error) {
        console.error('Error fetching current price:', error);
        setError('Failed to fetch current price');
      }
    };

    if (isOpen) {
      fetchCurrentPrice();
    }
  }, [holding, isOpen]);

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
    if (inputMode === 'crypto' && manualPrice) {
      const cryptoAmount = parseFloat(cleanValue) || 0;
      const price = parseFloat(manualPrice) || 0;
      setDollarValue((cryptoAmount * price).toFixed(2));
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
    if (inputMode === 'dollar' && manualPrice) {
      const dollarAmount = parseFloat(cleanValue) || 0;
      const price = parseFloat(manualPrice) || 0;
      setAmount((dollarAmount / price).toFixed(8));
    }
  };

  const handleManualPriceChange = (e) => {
    const value = e.target.value;
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      setManualPrice(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setManualPrice(cleanValue);
    }

    // Update dollar value if in crypto mode
    if (inputMode === 'crypto' && amount) {
      const cryptoAmount = parseFloat(amount) || 0;
      const price = parseFloat(cleanValue) || 0;
      setDollarValue((cryptoAmount * price).toFixed(2));
    }
    // Update crypto amount if in dollar mode
    else if (inputMode === 'dollar' && dollarValue) {
      const dollarAmount = parseFloat(dollarValue) || 0;
      const price = parseFloat(cleanValue) || 0;
      setAmount((dollarAmount / price).toFixed(8));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!holding || (!amount && !dollarValue)) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const price = parseFloat(manualPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    onEdit({
      ...holding,
      amount: numericAmount,
      value: numericAmount * price,
      purchaseDate: purchaseDate.toISOString(),
      purchasePrice: price
    });

    onClose();
  };

  if (!isOpen || !holding) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit {holding.name}
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
            <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800">
              <img
                src={holding.image}
                alt={holding.name}
                className="w-6 h-6 mr-2"
              />
              <div className="flex-1">
                <span className="text-gray-900 dark:text-white font-medium">
                  {holding.name} ({holding.symbol.toUpperCase()})
                </span>
                {currentPrice && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current Price: ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </div>

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
                Amount in {holding.symbol.toUpperCase()}
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
                placeholder={`Enter amount in ${inputMode === 'crypto' ? holding.symbol.toUpperCase() : 'USD'}...`}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">
                  {inputMode === 'crypto' ? holding.symbol.toUpperCase() : 'USD'}
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
                ≈ {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })} {holding.symbol.toUpperCase()}
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              dateFormat="MMMM d, yyyy"
              maxDate={new Date()}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Purchase Price
            </label>
            <div className="relative">
              <input
                type="text"
                value={manualPrice}
                onChange={handleManualPriceChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter purchase price in USD..."
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">USD</span>
              </div>
            </div>
            {currentPrice && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Current Price: ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-500 dark:text-red-400">{error}</p>
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
              disabled={!amount && !dollarValue}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCryptoModal; 