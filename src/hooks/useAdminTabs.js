import { useMemo } from 'react';
import { ADMIN_TABS } from '../config/adminTabs';

export const useAdminTabs = (userRole) => {
  const availableTabs = useMemo(() => {
    if (!userRole) return [];
    
    return ADMIN_TABS.filter(tab =>
      tab.requiredRoles.includes(userRole)
    );
  }, [userRole]);

  return availableTabs;
};
