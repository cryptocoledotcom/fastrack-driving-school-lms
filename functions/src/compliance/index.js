const complianceFunctions = require('./complianceFunctions');
const videoQuestionFunctions = require('./videoQuestionFunctions');
const enrollmentCertificateFunctions = require('./enrollmentCertificateFunctions');
const auditFunctions = require('./auditFunctions');
const detsFunctions = require('./detsFunctions');

module.exports = {
  ...complianceFunctions,
  ...videoQuestionFunctions,
  ...enrollmentCertificateFunctions,
  ...auditFunctions,
  ...detsFunctions
};
