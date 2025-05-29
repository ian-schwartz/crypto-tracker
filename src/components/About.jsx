const About = () => (
  <div className='container mx-auto px-6 py-24'>
    <section className='mb-12'>
      <h2 className='text-xl font-semibold dark:text-white'>Why CryptoTracker?</h2>
      <p className='mt-4 text-gray-700 dark:text-gray-200'>
        CryptoTracker was built to provide users with real-time cryptocurrency
        market insights and data, all in one intuitive platform. Whether you're
        a seasoned investor or new to crypto, CryptoTracker ensures you have
        access to the latest market trends.
      </p>
    </section>
    <section className='mb-12'>
      <h2 className='text-xl font-semibold dark:text-white'>How It Works</h2>
      <p className='mt-4 text-gray-700 dark:text-gray-200'>
        CryptoTracker leverages the CoinGecko API to fetch real-time
        cryptocurrency data, including prices, market caps, and trading volumes.
        WebSockets are used to provide live updates, ensuring you stay informed
        of the latest changes. Interactive charts provide visual insights into
        price movements and market trends.
      </p>
    </section>
    <section className='mb-12'>
      <h2 className='text-xl font-semibold dark:text-white'>Tech Stack</h2>
      <ul className='mt-4 list-disc list-inside text-gray-700 dark:text-gray-200'>
        <li>React</li>
        <li>Tailwind CSS</li>
        <li>Axios</li>
        <li>WebSockets</li>
        <li>CoinGecko API</li>
        <li>Chart.js</li>
      </ul>
    </section>
    <section>
      <h2 className='text-xl font-semibold dark:text-white'>Future Plans</h2>
      <ul className='mt-4 list-disc list-inside text-gray-700 dark:text-gray-200'>
        <li>User authentication and sign-in to unlock personalized features and watchlists</li>
        <li>A news page for the latest crypto updates</li>
        <li>Enhanced market analysis tools, such as Fear and Greed Index</li>
      </ul>
    </section>
  </div>
);

export default About;
