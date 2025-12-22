// Modal Context
// Global modal management for the application

import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

// Custom hook to use modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);

  // Open a modal
  const openModal = useCallback((modalConfig) => {
    const modalId = modalConfig.id || `modal_${Date.now()}`;
    const newModal = {
      id: modalId,
      type: modalConfig.type || 'base',
      title: modalConfig.title || '',
      content: modalConfig.content || null,
      onConfirm: modalConfig.onConfirm || null,
      onCancel: modalConfig.onCancel || null,
      onClose: modalConfig.onClose || null,
      confirmText: modalConfig.confirmText || 'Confirm',
      cancelText: modalConfig.cancelText || 'Cancel',
      showCancel: modalConfig.showCancel !== false,
      closeOnOverlayClick: modalConfig.closeOnOverlayClick !== false,
      closeOnEscape: modalConfig.closeOnEscape !== false,
      size: modalConfig.size || 'medium',
      data: modalConfig.data || null
    };

    setModals(prev => [...prev, newModal]);
    return modalId;
  }, []);

  // Close a specific modal
  const closeModal = useCallback((modalId) => {
    setModals(prev => {
      const modal = prev.find(m => m.id === modalId);
      if (modal && modal.onClose) {
        modal.onClose();
      }
      return prev.filter(m => m.id !== modalId);
    });
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    modals.forEach(modal => {
      if (modal.onClose) {
        modal.onClose();
      }
    });
    setModals([]);
  }, [modals]);

  // Close the topmost modal
  const closeTopModal = useCallback(() => {
    if (modals.length > 0) {
      const topModal = modals[modals.length - 1];
      closeModal(topModal.id);
    }
  }, [modals, closeModal]);

  // Show confirmation modal
  const showConfirmation = useCallback((config) => {
    return new Promise((resolve) => {
      const modalId = openModal({
        type: 'confirm',
        title: config.title || 'Confirm Action',
        content: config.message || 'Are you sure you want to proceed?',
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        onConfirm: () => {
          closeModal(modalId);
          resolve(true);
        },
        onCancel: () => {
          closeModal(modalId);
          resolve(false);
        },
        onClose: () => {
          resolve(false);
        }
      });
    });
  }, [openModal, closeModal]);

  // Show notification modal
  const showNotification = useCallback((config) => {
    const modalId = openModal({
      type: 'notification',
      title: config.title || 'Notification',
      content: config.message || '',
      confirmText: config.buttonText || 'OK',
      showCancel: false,
      onConfirm: () => {
        closeModal(modalId);
        if (config.onClose) config.onClose();
      },
      onClose: config.onClose
    });
    
    // Auto-close after duration if specified
    if (config.duration) {
      setTimeout(() => {
        closeModal(modalId);
      }, config.duration);
    }
    
    return modalId;
  }, [openModal, closeModal]);

  // Show success notification
  const showSuccess = useCallback((message, duration = 3000) => {
    return showNotification({
      title: 'Success',
      message,
      duration
    });
  }, [showNotification]);

  // Show error notification
  const showError = useCallback((message, duration = 5000) => {
    return showNotification({
      title: 'Error',
      message,
      duration
    });
  }, [showNotification]);

  // Show warning notification
  const showWarning = useCallback((message, duration = 4000) => {
    return showNotification({
      title: 'Warning',
      message,
      duration
    });
  }, [showNotification]);

  // Show info notification
  const showInfo = useCallback((message, duration = 3000) => {
    return showNotification({
      title: 'Information',
      message,
      duration
    });
  }, [showNotification]);

  // Check if any modal is open
  const isAnyModalOpen = modals.length > 0;

  // Get current modal
  const getCurrentModal = () => {
    return modals.length > 0 ? modals[modals.length - 1] : null;
  };

  const value = {
    // State
    modals,
    isAnyModalOpen,
    
    // Methods
    openModal,
    closeModal,
    closeAllModals,
    closeTopModal,
    showConfirmation,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    getCurrentModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export default ModalContext;