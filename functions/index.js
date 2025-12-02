const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');

initializeApp();

const functions = require('./src');

module.exports = functions;
