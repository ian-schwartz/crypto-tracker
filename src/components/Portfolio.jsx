import React, { useState, useEffect } from 'react';
import AddCryptoModal from './AddCryptoModal';

const Portfolio = () => {
  const [holdings, setHoldings] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load portfolio data from localStorage on component mount
  useEffect(() => {
    const savedHoldings = localStorage.getItem('portfolio');
    if (savedHoldings) {
      setHoldings(JSON.parse(savedHoldings));
    }
  }, []);

  // Save portfolio data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(holdings));
    const newTotalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
    setTotalValue(newTotalValue);
  }, [holdings]);

  const handleAddCrypto = (newHolding) => {
    setHoldings([...holdings, newHolding]);
  };

  const handleRemoveCrypto = (id) => {
    setHoldings(holdings.filter(holding => holding.id !== id));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          </p>
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
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {holdings.map((holding) => (
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
                      ${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      {holding.purchaseDate ? formatDate(holding.purchaseDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleRemoveCrypto(holding.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
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