const complianceFunctions = require('./complianceFunctions');
const videoQuestionFunctions = require('./videoQuestionFunctions');
const enrollmentCertificateFunctions = require('./enrollmentCertificateFunctions');
const auditFunctions = require('./auditFunctions');

module.exports = {
  ...complianceFunctions,
  ...videoQuestionFunctions,
  ...enrollmentCertificateFunctions,
  ...auditFunctions
};
