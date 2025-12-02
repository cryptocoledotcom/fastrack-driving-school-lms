const paymentFunctions = require('./payment');
const certificateFunctions = require('./certificate');
const complianceFunctions = require('./compliance');
const userFunctions = require('./user');

module.exports = {
  ...paymentFunctions,
  ...certificateFunctions,
  ...complianceFunctions,
  ...userFunctions
};
