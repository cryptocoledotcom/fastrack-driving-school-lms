import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import PaymentModal from '../PaymentModal';

// Mock constants locally and module mock
const COURSE_IDS = {
    ONLINE: 'fastrack-online',
    BEHIND_WHEEL: 'fastrack-behind-the-wheel',
    COMPLETE: 'fastrack-complete'
};

vi.mock('../../constants/courses', () => ({
    COURSE_IDS: {
        ONLINE: 'fastrack-online',
        BEHIND_WHEEL: 'fastrack-behind-the-wheel',
        COMPLETE: 'fastrack-complete'
    }
}));

// Mock child components
vi.mock('../CheckoutForm', () => ({
    default: () => <div data-testid="checkout-form">Checkout Form</div>,
}));
vi.mock('../CompletePackageCheckoutForm', () => ({
    default: () => <div data-testid="complete-package-form">Complete Package Form</div>,
}));
vi.mock('../RemainingPaymentCheckoutForm', () => ({
    default: () => <div data-testid="remaining-payment-form">Remaining Payment Form</div>,
}));

// Mock Stripe Elements wrapper
vi.mock('@stripe/react-stripe-js', () => ({
    Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,
}));

vi.mock('../../config/stripe', () => ({
    stripePromise: Promise.resolve({}),
}));

describe('PaymentModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        amount: 100,
        courseId: 'c1',
        courseName: 'Test Course',
        paymentType: 'full',
        onSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null if not open', () => {
        const { container } = render(<PaymentModal {...defaultProps} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should render CheckoutForm for standard course', () => {
        render(<PaymentModal {...defaultProps} />);
        expect(screen.getByTestId('checkout-form')).toBeInTheDocument();
        expect(screen.getByText('Complete Your Payment')).toBeInTheDocument();
    });

    it('should render CompletePackageCheckoutForm for complete package', () => {
        render(<PaymentModal {...defaultProps} courseId={COURSE_IDS.COMPLETE} />);
        expect(screen.getByTestId('complete-package-form')).toBeInTheDocument();
    });

    it('should render RemainingPaymentCheckoutForm for remaining balance type', () => {
        render(<PaymentModal {...defaultProps} paymentType="remaining_balance" />);
        expect(screen.getByTestId('remaining-payment-form')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
        render(<PaymentModal {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /×/i }));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay', () => {
        render(<PaymentModal {...defaultProps} />);
        // Just click the first div which should be the overlay
        // But testing library renders the container's children.
        // The component structure: <div overlay><div content>...</div></div>
        // render() returns container wrapping the output.
        // So container.firstChild is the overlay.
        const { container } = render(<PaymentModal {...defaultProps} />);
        fireEvent.click(container.firstChild);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
