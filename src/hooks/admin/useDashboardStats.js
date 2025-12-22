import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';

import { db } from '../../config/firebase';

export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    pendingCertificates: 0,
    monthlyRevenue: 0,
    recentActivity: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Certificates Query (Last 7 days, undownloaded)
        const certsQuery = query(
          collection(db, 'certificates'),
          where('awardedAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('awardedAt', 'desc'),
          limit(50) 
        );
        
        // 2. Revenue Query (Current Month, Completed)
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('status', '==', 'completed'),
          where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
          orderBy('createdAt', 'desc')
        );

        // 3. Activity Query (Last 5 Logins)
        const activityQuery = query(
          collection(db, 'auditLogs'),
          where('action', '==', 'USER_LOGIN'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );

        // Run queries in parallel
        const [certsSnap, paymentsSnap, activitySnap] = await Promise.all([
          getDocs(certsQuery),
          getDocs(paymentsQuery),
          getDocs(activityQuery)
        ]);

        // Process Certificates
        const pendingCertificates = certsSnap.docs.filter(
          doc => (doc.data().downloadCount || 0) === 0
        ).length;

        // Process Revenue
        const monthlyRevenue = paymentsSnap.docs.reduce(
          (sum, doc) => sum + (doc.data().amount || 0), 
          0
        );

        // Process Activity (Basic mapping, user join handled in component details if needed)
        const recentActivity = activitySnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Metadata usually contains safe display info like email/name if logged properly
          userName: doc.data().metadata?.email || 'User' 
        }));

        setStats({
          pendingCertificates,
          monthlyRevenue,
          recentActivity,
          loading: false,
          error: null
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setStats(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to load dashboard statistics' 
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
