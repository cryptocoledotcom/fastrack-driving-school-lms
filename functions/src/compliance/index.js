const complianceFunctions = require('./complianceFunctions');
const videoQuestionFunctions = require('./videoQuestionFunctions');
const enrollmentCertificateFunctions = require('./enrollmentCertificateFunctions');

module.exports = {
  ...complianceFunctions,
  ...videoQuestionFunctions,
  ...enrollmentCertificateFunctions
};
