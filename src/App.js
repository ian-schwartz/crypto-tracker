import React, { useState } from 'react';
import Header from './components/Header';
import Main from './components/Main';
import GradientBackground from './components/GradientBackground';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);

  const navigation = [
    { name: 'About', href: '#' },
    { name: 'Exchanges', href: '#' },
    { name: 'News', href: '#' },
  ];

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <GradientBackground />
      <Header
        navigation={navigation}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        resetToFirstPage={resetToFirstPage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      <Main currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default App;
