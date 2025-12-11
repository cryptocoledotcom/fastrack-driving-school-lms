import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminPanel } from '../../hooks/useAdminPanel';
import EnrollmentManagementTab from '../../components/admin/tabs/EnrollmentManagementTab';
import SchedulingManagement from '../../components/admin/SchedulingManagement';
import AnalyticsTab from '../../components/admin/tabs/AnalyticsTab';
import ComplianceReporting from '../../components/admin/ComplianceReporting';
import UserManagementTab from '../../components/admin/tabs/UserManagementTab';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import { USER_ROLES } from '../../constants/userRoles';
import styles from './AdminPage.module.css';

const AdminPage = () => {
    const { userProfile, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('enrollment');

    // Check access control
    if (!isAdmin && userProfile?.role !== USER_ROLES.SUPER_ADMIN && userProfile?.role !== USER_ROLES.DMV_ADMIN) {
        return <ErrorMessage message="Access Denied" />;
    }

    const {
        users,
        loading: loadingEnrollments,
        resettingEnrollments,
        loadUsers: loadEnrollmentData,
        handleResetEnrollment,
        handleResetAllUserEnrollments
    } = useAdminPanel();

    const getCourseName = (courseId) => {
        const names = {
            'fastrack-online': 'Fastrack Online Course',
            'fastrack-behind-the-wheel': 'Fastrack Behind-the-Wheel Course',
            'fastrack-complete': 'Fastrack Complete Package'
        };
        return names[courseId] || courseId;
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'active': return 'status-active';
            case 'pending_payment': return 'status-pending';
            case 'completed': return 'status-completed';
            default: return 'status-default';
        }
    };

    const getPaymentStatusBadgeClass = (status) => {
        switch (status) {
            case 'completed': return 'payment-completed';
            case 'partial': return 'payment-partial';
            case 'pending': return 'payment-pending';
            default: return 'payment-default';
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'enrollment':
                return (
                    <EnrollmentManagementTab
                        users={users}
                        onResetEnrollment={handleResetEnrollment}
                        onResetAllUserEnrollments={handleResetAllUserEnrollments}
                        resettingEnrollments={resettingEnrollments}
                        getCourseName={getCourseName}
                        getStatusBadgeClass={getStatusBadgeClass}
                        getPaymentStatusBadgeClass={getPaymentStatusBadgeClass}
                        onRefresh={loadEnrollmentData}
                    />
                );
            case 'scheduling':
                return <SchedulingManagement />;
            case 'analytics':
                return <AnalyticsTab />;
            case 'compliance':
                return <ComplianceReporting />;
            case 'user_management':
                return <UserManagementTab />;
            default:
                return null;
        }
    };

    if (loadingEnrollments && !users.length && activeTab === 'enrollment') {
        return <LoadingSpinner fullScreen text="Loading admin dashboard..." />;
    }

    return (
        <div className={styles.adminPage}>
            <div className={styles.header}>
                <h1>Admin Dashboard</h1>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'enrollment' ? styles.active : ''}`}
                        onClick={() => setActiveTab('enrollment')}
                    >
                        Enrollment Management
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'scheduling' ? styles.active : ''}`}
                        onClick={() => setActiveTab('scheduling')}
                    >
                        Lesson Scheduling
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        Analytics
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'compliance' ? styles.active : ''}`}
                        onClick={() => setActiveTab('compliance')}
                    >
                        Compliance Reports
                    </button>
                    {userProfile?.role === USER_ROLES.SUPER_ADMIN && (
                        <button
                            className={`${styles.tab} ${activeTab === 'user_management' ? styles.active : ''}`}
                            onClick={() => setActiveTab('user_management')}
                        >
                            User Management
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.content}>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default AdminPage;
