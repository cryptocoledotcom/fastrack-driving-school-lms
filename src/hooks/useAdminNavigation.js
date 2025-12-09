import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_SIDEBAR_ITEMS } from '../config/adminRoutes';

const useAdminNavigation = () => {
  const { userProfile } = useAuth();

  const availableItems = useMemo(() => {
    if (!userProfile || !userProfile.role) {
      return [];
    }

    return ADMIN_SIDEBAR_ITEMS.filter(item =>
      item.requiredRoles.includes(userProfile.role)
    );
  }, [userProfile]);

  return availableItems;
};

export default useAdminNavigation;
