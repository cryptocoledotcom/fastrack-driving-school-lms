import Card from '../../common/Card/Card';

import styles from './ActivityWidget.module.css';

const ActivityWidget = ({ activities, loading }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };


    return (
        <Card className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
                <h3>Recent Activity</h3>
                <span className={styles.icon}>🕒</span>
            </div>
            <div className={styles.widgetContent}>
                {loading ? (
                    <div className={styles.spinner}></div>
                ) : (
                    <div className={styles.activityList}>
                        {activities.length === 0 ? (
                            <p className={styles.emptyState}>No recent logins</p>
                        ) : (
                            activities.map((log) => (
                                <div key={log.id} className={styles.activityItem}>
                                    <div className={styles.activityUser}>
                                        <span className={styles.userAvatar}>👤</span>
                                        <span className={styles.userName}>{log.userName || 'User'}</span>
                                    </div>
                                    <span className={styles.activityTime}>{formatDate(log.timestamp)}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ActivityWidget;
