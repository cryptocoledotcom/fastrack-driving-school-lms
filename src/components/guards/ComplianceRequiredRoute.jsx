import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { getSecurityProfile } from '../../api/security/securityServices';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import Card from '../common/Card/Card';
import Button from '../common/Button/Button';

import styles from './ComplianceRequiredRoute.module.css';

const ComplianceRequiredRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasSecurityQuestions, setHasSecurityQuestions] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    const checkCompliance = async () => {
      try {
        const securityProfile = await getSecurityProfile(user.uid);
        setHasSecurityQuestions(
          !!securityProfile && 
          !!securityProfile.question1 && 
          !!securityProfile.question2 && 
          !!securityProfile.question3
        );
      } catch (error) {
        console.error('Error checking security questions:', error);
        setHasSecurityQuestions(false);
      } finally {
        setChecking(false);
      }
    };

    checkCompliance();
  }, [user, loading]);

  if (loading || checking) {
    return <LoadingSpinner fullScreen text="Verifying compliance..." />;
  }

  if (!user) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!hasSecurityQuestions) {
    return (
      <div className={styles.complianceContainer}>
        <Card className={styles.complianceCard}>
          <div className={styles.content}>
            <h1 className={styles.title}>⚠️ Security Setup Required</h1>
            <p className={styles.description}>
              Before accessing courses, you must set up security questions. These are required by Ohio state compliance regulations to verify your identity during lessons.
            </p>
            <div className={styles.requirements}>
              <h3>What you need to do:</h3>
              <ul>
                <li>Set up at least 3 security questions</li>
                <li>Use questions you can reliably answer</li>
                <li>Remember your answers - you'll be prompted randomly during courses</li>
              </ul>
            </div>
            <div className={styles.actions}>
              <Button
                onClick={() => navigate('/dashboard/settings', {
                  state: { 
                    from: location.pathname,
                    tab: 'security'
                  }
                })}
                variant="primary"
              >
                Set Up Security Questions
              </Button>
              <Button
                onClick={() => navigate(-1)}
                variant="secondary"
              >
                Go Back
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return children;
};

export default ComplianceRequiredRoute;
