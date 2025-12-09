let cachedDb = null;
let cachedAuth = null;

function getDb() {
  if (cachedDb) {
    return cachedDb;
  }
  const { getFirestore } = require('firebase-admin/firestore');
  cachedDb = getFirestore();
  return cachedDb;
}

function setDb(db) {
  cachedDb = db;
}

function resetDb() {
  cachedDb = null;
}

function getAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }
  const admin = require('firebase-admin');
  cachedAuth = admin.auth();
  return cachedAuth;
}

function setAuth(auth) {
  cachedAuth = auth;
}

function resetAuth() {
  cachedAuth = null;
}

module.exports = {
  getDb,
  setDb,
  resetDb,
  getAuth,
  setAuth,
  resetAuth,
};
