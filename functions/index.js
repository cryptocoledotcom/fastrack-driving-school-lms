const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { initSentry } = require('./src/config/sentry');

initSentry();
initializeApp();

const functions = require('./src');

module.exports = functions;
