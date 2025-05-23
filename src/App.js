import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DarkModeProvider } from './context/DarkModeContext';
import Header from './components/Header';
import Main from './components/Main';
import GradientBackground from './components/GradientBackground';
import Exchanges from './components/Exchanges';
import About from './components/About';
import CryptoDetail from './components/CryptoDetail';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Exchanges', href: '/exchanges' },
  ];

  return (
    <DarkModeProvider>
      <Router>
        <div className={darkMode ? 'dark' : ''}>
          <GradientBackground />
          <Header
            navigation={navigation}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
          <Routes>
            <Route
              path='/'
              element={
                <Main
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                />
              }
            />
            <Route path='/exchanges' element={<Exchanges />} />
            <Route path='/about' element={<About />} />
            <Route path='/crypto/:id' element={<CryptoDetail />} />
          </Routes>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
