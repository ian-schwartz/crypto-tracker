import React from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Link } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

const Header = ({ navigation, mobileMenuOpen, setMobileMenuOpen }) => {
  const { darkMode, setDarkMode } = useDarkMode();

  return (
    <header className='absolute inset-x-0 top-0 z-50'>
      <nav
        aria-label='Global'
        className='flex items-center justify-between p-6 lg:px-8'
      >
        <div className='flex lg:flex-1'>
          <Link to="/" className='text-xl font-bold dark:text-white hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors'>
            CryptoTracker
          </Link>
        </div>
        <div className='flex lg:hidden'>
          <button
            type='button'
            onClick={() => setMobileMenuOpen(true)}
            className='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-white'
          >
            <span className='sr-only'>Open main menu</span>
            <Bars3Icon aria-hidden='true' className='size-6' />
          </button>
        </div>
        <div className='hidden lg:flex lg:gap-x-12'>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className='text-sm font-semibold text-gray-900 hover:text-indigo-500 dark:text-white dark:hover:text-indigo-300'
            >
              {item.name}
            </a>
          ))}
        </div>
        <div className='hidden lg:flex lg:flex-1 lg:justify-end'>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className='ml-4 p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          >
            {darkMode ? (
              <SunIcon className='h-6 w-6 text-gray-900 dark:text-gray-300' />
            ) : (
              <MoonIcon className='h-6 w-6 text-gray-900 dark:text-gray-300' />
            )}
          </button>
        </div>
      </nav>
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className='fixed inset-0 z-50' />
        <DialogPanel className='fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-900 dark:sm:ring-white/10'>
          <div className='flex items-center justify-between'>
            <Link to="/" className='-m-1.5 p-1.5'>
              <span className='text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors'>
                CryptoTracker
              </span>
            </Link>
            <button
              type='button'
              onClick={() => setMobileMenuOpen(false)}
              className='-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-white'
            >
              <span className='sr-only'>Close menu</span>
              <XMarkIcon aria-hidden='true' className='size-6' />
            </button>
          </div>
          <div className='mt-6 flow-root'>
            <div className='-my-6 divide-y divide-gray-500/10'>
              <div className='space-y-2 py-6'>
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className='-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:text-indigo-500 dark:text-white'
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className='py-6 border-t border-gray-200 dark:border-gray-700'>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className='w-full flex items-center gap-2 justify-center p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            >
              {darkMode ? (
                <>
                  <SunIcon className='h-5 w-5 text-gray-900 dark:text-gray-300' />
                  <span className='text-sm font-medium text-gray-900 dark:text-white'>
                    Light Mode
                  </span>
                </>
              ) : (
                <>
                  <MoonIcon className='h-5 w-5 text-gray-900 dark:text-gray-300' />
                  <span className='text-sm font-medium text-gray-900 dark:text-white'>
                    Dark Mode
                  </span>
                </>
              )}
            </button>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
};

export default Header;
