import styles from './LandingPage.module.css';

const LandingPage = () => {

  return (
    <div className={styles.pageContainer}>
      {/* Navigation / Brand */}
      <nav className={styles.nav}>
        <img src="/assets/images/logo.png" alt="Fastrack Driving School" className={styles.brandLogo} />
      </nav>

      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.badge}>Coming Q1 2026</div>
          <h1 className={styles.headline}>We're Building Something Great</h1>
          <p className={styles.subheadline}>
            The next generation of Ohio-compliant driver education management is almost here. 
            Streamlined, secure, and built for the future.
          </p>
        </section>

        {/* Value Proposition Grid */}
        <section className={styles.featuresSection}>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              {/* Custom Shield Icon */}
              <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>State Compliant</h3>
            <p>Fully aligned with Ohio state regulations for driver education curriculum and tracking.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              {/* Custom Play/Video Icon */}
              <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
            <h3>Interactive Learning</h3>
            <p>High-definition video modules and interactive quizzes to engage modern students.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              {/* Custom Device Icon */}
              <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <h3>Anywhere Access</h3>
            <p>A responsive platform that allows students to learn on mobile, tablet, or desktop.</p>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContainer}>
            <h2>In the Meantime</h2>
            <p>While we're building the next generation of driver education, we're still here to help you.</p>
            
            <div className={styles.contactOptions}>
              <div className={styles.contactOption}>
                <h3>Behind the Wheel Training</h3>
                <p>Call us at <a href="tel:412-974-8858">(412) 974-8858</a> to schedule your practical driving lessons.</p>
              </div>
              
              <div className={styles.contactOption}>
                <h3>More Information</h3>
                <p>Email us at <a href="mailto:info@fastrackdrive.com">info@fastrackdrive.com</a> with your name, questions, and we'll get back to you shortly.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerInfo}>
            <h4>Fastrack Driving School LLC</h4>
            <address>
              45122 Oak Dr.<br />
              Wellsville, Ohio 43968
            </address>
          </div>
          <div className={styles.footerContact}>
            <p><strong>Email:</strong> info@fastrackdrive.com</p>
            <p><strong>Phone:</strong> (412) 974-8858</p>
          </div>
        </div>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} Fastrack Driving School. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;