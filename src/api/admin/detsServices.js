import { httpsCallable, getFunctions } from 'firebase/functions';

import { executeService } from '../base/ServiceWrapper';

const getCallables = () => {
  const functions = getFunctions();
  return {
    detsExportReport: httpsCallable(functions, 'exportDETSReport'),
    detsSubmitToState: httpsCallable(functions, 'submitDETSToState'),
    detsGetReports: httpsCallable(functions, 'getDETSReports'),
    detsValidateRecord: httpsCallable(functions, 'validateDETSRecord'),
  };
};

export const detsServices = {
  generateDETSReport: async (courseId, startDate, endDate, studentIds = null) => {
    return executeService(
      async () => {
        const { detsExportReport } = getCallables();
        const response = await detsExportReport({
          courseId,
          startDate,
          endDate,
          studentIds
        });
        return response.data;
      },
      'generateDETSReport'
    );
  },

  submitDETSReport: async (reportId) => {
    return executeService(
      async () => {
        const { detsSubmitToState } = getCallables();
        const response = await detsSubmitToState({
          reportId
        });
        return response.data;
      },
      'submitDETSReport'
    );
  },

  getDETSReports: async (limit = 50, offset = 0) => {
    return executeService(
      async () => {
        const { detsGetReports } = getCallables();
        const response = await detsGetReports({
          limit,
          offset
        });
        return response.data;
      },
      'getDETSReports'
    );
  },

  validateDETSRecord: async (record) => {
    return executeService(
      async () => {
        const { detsValidateRecord } = getCallables();
        const response = await detsValidateRecord(record);
        return response.data;
      },
      'validateDETSRecord'
    );
  },

  retryDETSSubmission: async (reportId) => {
    return executeService(
      async () => {
        const { detsSubmitToState } = getCallables();
        const response = await detsSubmitToState({
          reportId,
          retry: true
        });
        return response.data;
      },
      'retryDETSSubmission'
    );
  },

  getDETSReportById: async (reportId) => {
    return executeService(
      async () => {
        const { detsGetReports } = getCallables();
        const response = await detsGetReports({
          reportId
        });
        return response.data;
      },
      'getDETSReportById'
    );
  },

  exportReportAsCSV: async (reportId) => {
    return executeService(
      async () => {
        const { detsGetReports } = getCallables();
        const reportResponse = await detsGetReports({
          reportId
        });
        const report = reportResponse.data;

        if (!report || !report.records) {
          throw new Error('Report not found or has no records');
        }

        const records = report.records;
        const headers = [
          'Student ID',
          'First Name',
          'Last Name',
          'Date of Birth',
          'Driver License',
          'School Name',
          'Course Name',
          'Completion Date',
          'Instruction Time (min)',
          'Exam Score (%)',
          'Exam Passed',
          'Certificate ID',
          'Exported At'
        ];

        const rows = records.map(r => [
          r.studentId,
          r.firstName,
          r.lastName,
          r.dateOfBirth,
          r.driverLicense,
          r.schoolName,
          r.courseName,
          r.completionDate,
          r.totalInstructionMinutes,
          r.examScore,
          r.examPassed ? 'Yes' : 'No',
          r.certificateId,
          r.exportedAt
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return {
          filename: `dets-report-${reportId}-${new Date().toISOString().split('T')[0]}.csv`,
          content: csvContent
        };
      },
      'exportReportAsCSV'
    );
  }
};

export default detsServices;
