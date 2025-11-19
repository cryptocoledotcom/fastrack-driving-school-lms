import React, { useState } from 'react';
import { runInitialization } from './initializeDatabase';

const DbInitializer = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInitialize = async () => {
    setLoading(true);
    setMessage('Starting database initialization...');
    try {
      await runInitialization();
      setMessage('Database initialization completed successfully!');
    } catch (error) {
      setMessage(`Error initializing database: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Database Initializer</h2>
      <button onClick={handleInitialize} disabled={loading}>
        {loading ? 'Initializing...' : 'Run Initialization Script'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default DbInitializer;