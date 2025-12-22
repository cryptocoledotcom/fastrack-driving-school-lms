const { initializeApp } = require('firebase-admin/app');

const { initSentry } = require('./src/config/sentry');
const functions = require('./src');

initSentry();
initializeApp();

module.exports = functions;
