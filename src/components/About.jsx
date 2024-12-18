const About = () => (
  <div className='container mx-auto px-6 py-24'>
    <h1 className='text-3xl font-bold text-center mb-8'>About CryptoTracker</h1>
    <section className='mb-12'>
      <h2 className='text-xl font-semibold'>Why CryptoTracker?</h2>
      <p className='mt-4 text-gray-700'>
        CryptoTracker was built to provide users with real-time cryptocurrency
        market insights and data, all in one intuitive platform. Whether you're
        a seasoned investor or new to crypto, CryptoTracker ensures you have
        access to the latest market trends.
      </p>
    </section>
    <section className='mb-12'>
      <h2 className='text-xl font-semibold'>How It Works</h2>
      <p className='mt-4 text-gray-700'>
        CryptoTracker leverages the CoinGecko API to fetch real-time
        cryptocurrency data, including prices, market caps, and trading volumes.
        WebSockets are used to provide live updates, ensuring you stay informed
        of the latest changes.
      </p>
    </section>
    <section className='mb-12'>
      <h2 className='text-xl font-semibold'>Tech Stack</h2>
      <ul className='mt-4 list-disc list-inside text-gray-700'>
        <li>React</li>
        <li>Tailwind CSS</li>
        <li>Axios</li>
        <li>WebSockets</li>
        <li>CoinGecko API</li>
      </ul>
    </section>
    <section>
      <h2 className='text-xl font-semibold'>Future Plans</h2>
      <ul className='mt-4 list-disc list-inside text-gray-700'>
        <li>Individual cryptocurrency pages with detailed charts</li>
        <li>A news page for the latest crypto updates</li>
        <li>Enhanced market analysis tools, such as Fear and Greed Index</li>
      </ul>
    </section>
  </div>
);

export default About;
