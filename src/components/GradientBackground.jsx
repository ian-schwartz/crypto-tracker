import React from 'react';

const GradientBackground = () => {
  return (
    <div
      aria-hidden='true'
      className='fixed inset-0 -z-10 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 
                 dark:from-[#1a1a2e] dark:to-[#162447] dark:opacity-50'
    />
  );
};

export default GradientBackground;
