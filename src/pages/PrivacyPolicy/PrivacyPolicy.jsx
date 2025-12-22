
import styles from './PrivacyPolicy.module.css';

const privacyPolicyContent = {
  title: 'Privacy Policy',
  lastUpdated: 'Last Updated: December 8, 2025',
  intro: 'At Fastrack Driving School, we are committed to protecting your privacy and ensuring the security of your personal information. This policy outlines how we collect, use, and safeguard the data required for your driver education training in compliance with Ohio state regulations.',
  sections: [
    {
      heading: '1. Information We Collect',
      content: 'To provide state-compliant driver education, we are required by the Ohio Department of Public Safety (ODPS) to collect specific Confidential Personal Information (CPI). This includes your legal name, date of birth, address, phone number, email address, and driver identification number (TIPIC). We also collect parent/guardian information for students under the age of 18 for identity verification purposes.'
    },
    {
      heading: '2. How We Use Your Information',
      content: 'Your information is used strictly for the following purposes: validating your identity, tracking your course progress, issuing your Certificate of Completion, and reporting your mandatory training data to the Ohio Driver Education and Training System (DETS). We do not use your personal information for marketing purposes unrelated to your course.'
    },
    {
      heading: '3. Data Security',
      content: 'We utilize industry-standard encryption (AES-256) and secure cloud infrastructure (Google Cloud Platform) to protect your data during transmission and storage. Access to your personal records is restricted to authorized school administrators and state auditors.'
    },
    {
      heading: '4. FERPA & Confidentiality',
      content: 'In accordance with the Family Educational Rights and Privacy Act (FERPA) and iNACOL Standard D11, your educational records, grades, and driving history are strictly confidential. We will not disclose your records to any third party without your consent, except as required by law for state auditing and reporting.'
    },
    {
      heading: '5. Information Sharing',
      content: 'We do not sell, trade, or rent your personal identification information to others. Your data is shared only with the Ohio Department of Public Safety as required for the issuance of your driver education certificate.'
    }
  ]
};

const PrivacyPolicy = () => {
  return (
    <div className={styles.privacyPolicyPage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{privacyPolicyContent.title}</h1>
          <p className={styles.lastUpdated}>{privacyPolicyContent.lastUpdated}</p>
        </header>

        <section className={styles.intro}>
          <p>{privacyPolicyContent.intro}</p>
        </section>

        <section className={styles.sectionsContainer}>
          {privacyPolicyContent.sections.map((section, index) => (
            <article key={index} className={styles.policySection}>
              <h2 className={styles.sectionHeading}>{section.heading}</h2>
              <p className={styles.sectionContent}>{section.content}</p>
            </article>
          ))}
        </section>

        <footer className={styles.footer}>
          <p>For questions regarding this privacy policy, please contact our support team at support@fastrackdrive.com.</p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
