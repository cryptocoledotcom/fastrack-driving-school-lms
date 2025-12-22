import Card from '../../common/Card/Card';

import styles from './RevenueWidget.module.css';

const RevenueWidget = ({ amount, loading }) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount / 100); // Assuming amount is in cents

    return (
        <Card className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
                <h3>Monthly Revenue</h3>
                <span className={styles.icon}>💰</span>
            </div>
            <div className={styles.widgetContent}>
                {loading ? (
                    <div className={styles.spinner}></div>
                ) : (
                    <div className={styles.statValue}>{formattedAmount}</div>
                )}
                <p className={styles.statLabel}>Completed payments this month</p>
            </div>
        </Card>
    );
};

export default RevenueWidget;
