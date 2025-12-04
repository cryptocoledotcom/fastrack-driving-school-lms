// Application Entry Point

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/styles/global.css';
import './assets/styles/theme.css';
import './assets/styles/animations.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
