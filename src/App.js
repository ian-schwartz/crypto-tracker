import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DarkModeProvider } from './context/DarkModeContext';
import Header from './components/Header';
import Main from './components/Main';
import GradientBackground from './components/GradientBackground';
import Exchanges from './components/Exchanges';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '#' },
    { name: 'Exchanges', href: '/exchanges' },
    { name: 'News', href: '#' },
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
          </Routes>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
