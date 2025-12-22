import { useNavigate } from 'react-router-dom';

import Card from '../../common/Card/Card';

import styles from './CertificatesWidget.module.css';

const CertificatesWidget = ({ count, loading }) => {
    const navigate = useNavigate();

    return (
        <Card className={styles.widgetCard} clickable onClick={() => navigate('/admin/certificates')}>
            <div className={styles.widgetHeader}>
                <h3>New Certificates</h3>
                <span className={styles.icon}>🎓</span>
            </div>
            <div className={styles.widgetContent}>
                {loading ? (
                    <div className={styles.spinner}></div>
                ) : (
                    <div className={styles.statValue}>{count}</div>
                )}
                <p className={styles.statLabel}>Awaiting download (last 7 days)</p>
            </div>
        </Card>
    );
};

export default CertificatesWidget;
