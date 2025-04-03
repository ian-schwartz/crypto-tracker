import React from 'react';

const Pagination = ({ currentPage, handlePageChange, totalPages }) => {
  return (
    <div className='flex justify-between items-center mt-8'>
      <button
        onClick={() => handlePageChange('prev')}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-md ${
          currentPage === 1
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
      >
        Previous
      </button>
      <p className='text-gray-700 dark:text-white'>
        Page {currentPage} of {totalPages}
      </p>
      <button
        onClick={() => handlePageChange('next')}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-md ${
          currentPage === totalPages
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
