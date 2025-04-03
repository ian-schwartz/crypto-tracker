import React from 'react';

const GradientBackground = () => {
  return (
    <div
      aria-hidden='true'
      className='fixed inset-0 -z-10 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 
                 dark:from-[#0c0f1a] dark:to-[#1a1f2b] dark:opacity-90'
    />
  );
};

export default GradientBackground;
