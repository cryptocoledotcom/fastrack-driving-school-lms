// Footer Component
// Site footer with links

import React from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../../constants/routes';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Company Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Fastrack Driving School</h3>
            <p className={styles.description}>
              Your trusted partner in learning to drive safely and confidently.
              Professional instruction with modern teaching methods.
            </p>
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Quick Links</h3>
            <ul className={styles.linkList}>
              <li>
                <Link to={PUBLIC_ROUTES.HOME} className={styles.link}>
                  Home
                </Link>
              </li>
              <li>
                <Link to={PUBLIC_ROUTES.COURSES} className={styles.link}>
                  Courses
                </Link>
              </li>
              <li>
                <Link to={PUBLIC_ROUTES.ABOUT} className={styles.link}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to={PUBLIC_ROUTES.CONTACT} className={styles.link}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Legal</h3>
            <ul className={styles.linkList}>
              <li>
                <Link to="/privacy" className={styles.link}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className={styles.link}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className={styles.link}>
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact Us</h3>
            <ul className={styles.contactList}>
              <li>📧 info@fastrackdrive.com</li>
              <li>📞 (412) 974-8858</li>
              <li>📍 45122 Oak Dr., Wellsville, Ohio 43968</li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} Fastrack Driving School. All rights reserved.
          </p>
          <div className={styles.social}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              Facebook
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              Twitter
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;