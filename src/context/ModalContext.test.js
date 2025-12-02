import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalProvider, useModal } from './ModalContext';

describe('ModalContext', () => {
  describe('useModal hook', () => {
    it('should provide modal context inside ModalProvider', () => {
      const TestComponent = () => {
        const { modals } = useModal();
        return <div>{modals.length} modals</div>;
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('0 modals')).toBeInTheDocument();
    });
  });

  describe('ModalProvider', () => {
    it('should render children', () => {
      render(
        <ModalProvider>
          <div>Test Child</div>
        </ModalProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with empty modals array', () => {
      const TestComponent = () => {
        const { modals } = useModal();
        return <div>{modals.length} modals</div>;
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('0 modals')).toBeInTheDocument();
    });
  });

  describe('openModal method', () => {
    it('should open a modal', () => {
      const TestComponent = () => {
        const { modals, openModal } = useModal();
        return (
          <>
            <button onClick={() => openModal({ id: 'test', title: 'Test' })}>Open</button>
            <div>{modals.length} modals</div>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('0 modals')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Open'));
      expect(screen.getByText('1 modals')).toBeInTheDocument();
    });

    it('should generate unique id when not provided', () => {
      const TestComponent = () => {
        const { modals, openModal } = useModal();
        return (
          <>
            <button onClick={() => openModal({ title: 'Test' })}>Open</button>
            <div>{modals[0]?.id || 'No id'}</div>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      fireEvent.click(screen.getByText('Open'));
      expect(screen.queryByText('No id')).not.toBeInTheDocument();
    });

    it('should set default values for modal config', () => {
      const TestComponent = () => {
        const { modals, openModal } = useModal();
        return (
          <>
            <button onClick={() => openModal({ id: 'test' })}>Open</button>
            <div>
              {modals[0]?.type || 'No type'} - {modals[0]?.size || 'No size'}
            </div>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      fireEvent.click(screen.getByText('Open'));
      expect(screen.getByText('base - medium')).toBeInTheDocument();
    });
  });

  describe('closeModal method', () => {
    it('should close a specific modal', () => {
      const TestComponent = () => {
        const { modals, openModal, closeModal } = useModal();
        const modalId = 'test';

        return (
          <>
            <button onClick={() => openModal({ id: modalId, title: 'Test' })}>Open</button>
            <button onClick={() => closeModal(modalId)}>Close</button>
            <div>{modals.length} modals</div>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      fireEvent.click(screen.getByText('Open'));
      expect(screen.getByText('1 modals')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close'));
      expect(screen.getByText('0 modals')).toBeInTheDocument();
    });

    it('should call onClose callback when closing', () => {
      const onClose = jest.fn();
      const TestComponent = () => {
        const { modals, openModal, closeModal } = useModal();
        const modalId = 'test';

        return (
          <>
            <button onClick={() => openModal({ id: modalId, onClose })}>Open</button>
            <button onClick={() => closeModal(modalId)}>Close</button>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      fireEvent.click(screen.getByText('Open'));
      fireEvent.click(screen.getByText('Close'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('closeAllModals method', () => {
    it('should close all open modals', () => {
      const TestComponent = () => {
        const { modals, openModal, closeAllModals } = useModal();

        return (
          <>
            <button onClick={() => {
              openModal({ id: 'modal1' });
              openModal({ id: 'modal2' });
            }}>Open Multiple</button>
            <button onClick={closeAllModals}>Close All</button>
            <div>{modals.length} modals</div>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      fireEvent.click(screen.getByText('Open Multiple'));
      expect(screen.getByText('2 modals')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close All'));
      expect(screen.getByText('0 modals')).toBeInTheDocument();
    });
  });

  describe('closeTopModal method', () => {
    it('should close the topmost modal', () => {
      const TestComponent = () => {
        const { modals, openModal, closeTopModal } = useModal();

        return (
          <>
            <button onClick={() => {
              openModal({ id: 'modal1' });
              openModal({ id: 'modal2' });
            }}>Open Multiple</button>
            <button onClick={closeTopModal}>Close Top</button>
            <div>{modals.length} modals</div>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      fireEvent.click(screen.getByText('Open Multiple'));
      fireEvent.click(screen.getByText('Close Top'));
      expect(screen.getByText('1 modals')).toBeInTheDocument();
    });
  });

  describe('isAnyModalOpen property', () => {
    it('should return false when no modals are open', () => {
      const TestComponent = () => {
        const { isAnyModalOpen } = useModal();
        return <div>{isAnyModalOpen ? 'Open' : 'Closed'}</div>;
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('should return true when modals are open', () => {
      const TestComponent = () => {
        const { isAnyModalOpen, openModal } = useModal();
        return (
          <>
            <button onClick={() => openModal({ id: 'test' })}>Open Modal</button>
            <div>{isAnyModalOpen ? 'IsOpen' : 'IsClosed'}</div>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      fireEvent.click(screen.getByText('Open Modal'));
      expect(screen.getByText('IsOpen')).toBeInTheDocument();
    });
  });

  describe('getCurrentModal method', () => {
    it('should return the topmost modal', () => {
      const TestComponent = () => {
        const { openModal, getCurrentModal } = useModal();
        const current = getCurrentModal();

        return (
          <>
            <button onClick={() => openModal({ id: 'test', title: 'Current' })}>Open</button>
            <div>{current ? current.title : 'No modal'}</div>
          </>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      fireEvent.click(screen.getByText('Open'));
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should return null when no modals are open', () => {
      const TestComponent = () => {
        const { getCurrentModal } = useModal();
        const current = getCurrentModal();
        return <div>{current ? 'Has modal' : 'No modal'}</div>;
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('No modal')).toBeInTheDocument();
    });
  });

  describe('showConfirmation method', () => {
    it('should provide showConfirmation method', () => {
      const TestComponent = () => {
        const { showConfirmation } = useModal();
        return (
          <button onClick={() => showConfirmation({ title: 'Confirm?' })}>
            Show Confirmation
          </button>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('Show Confirmation')).toBeInTheDocument();
    });
  });

  describe('showNotification method', () => {
    it('should provide showNotification method', () => {
      const TestComponent = () => {
        const { showNotification } = useModal();
        return (
          <button onClick={() => showNotification({ title: 'Notice', message: 'Info' })}>
            Show Notification
          </button>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('Show Notification')).toBeInTheDocument();
    });
  });

  describe('showSuccess method', () => {
    it('should provide showSuccess method', () => {
      const TestComponent = () => {
        const { showSuccess } = useModal();
        return (
          <button onClick={() => showSuccess('Success!')}>
            Show Success
          </button>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('Show Success')).toBeInTheDocument();
    });
  });

  describe('showError method', () => {
    it('should provide showError method', () => {
      const TestComponent = () => {
        const { showError } = useModal();
        return (
          <button onClick={() => showError('Error!')}>
            Show Error
          </button>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('Show Error')).toBeInTheDocument();
    });
  });

  describe('showWarning method', () => {
    it('should provide showWarning method', () => {
      const TestComponent = () => {
        const { showWarning } = useModal();
        return (
          <button onClick={() => showWarning('Warning!')}>
            Show Warning
          </button>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('Show Warning')).toBeInTheDocument();
    });
  });

  describe('showInfo method', () => {
    it('should provide showInfo method', () => {
      const TestComponent = () => {
        const { showInfo } = useModal();
        return (
          <button onClick={() => showInfo('Information')}>
            Show Info
          </button>
        );
      };

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      expect(screen.getByText('Show Info')).toBeInTheDocument();
    });
  });
});
