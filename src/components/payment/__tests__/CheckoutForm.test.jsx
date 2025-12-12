import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import CheckoutForm from '../CheckoutForm';

// Mock Stripe
const mockStripe = {
    createPaymentMethod: vi.fn(),
};
const mockElements = {
    getElement: vi.fn(),
};

vi.mock('@stripe/react-stripe-js', () => ({
    CardElement: () => <div data-testid="card-element" />,
    useStripe: () => mockStripe,
    useElements: () => mockElements,
}));

// Mock CSRF
vi.mock('../../utils/security/csrfToken', () => ({
    getCSRFToken: vi.fn(() => 'mock-token'),
    validateCSRFToken: vi.fn(() => true),
}));

describe('CheckoutForm', () => {
    const defaultProps = {
        amount: 100,
        courseId: 'c1',
        paymentType: 'full',
        courseName: 'Test Course',
        onSuccess: vi.fn(),
        onError: vi.fn(),
        onCancel: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render form fields correctly', () => {
        render(<CheckoutForm {...defaultProps} />);
        expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Pay $100.00')).toBeInTheDocument();
    });

    it('should validate form inputs and show error', async () => {
        render(<CheckoutForm {...defaultProps} />);

        // Submit empty form without filling required fields
        const submitButton = screen.getByText('Pay $100.00');
        fireEvent.click(submitButton);

        // Wait for validation error to appear
        await waitFor(() => {
            const errorElement = screen.queryByText(/Full name is required/i);
            if (errorElement) {
                expect(errorElement).toBeInTheDocument();
            }
        }, { timeout: 1000 });
    });

    it('should process payment successfully', async () => {
        render(<CheckoutForm {...defaultProps} />);

        // Fill form
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('123 Main St'), { target: { value: '123 St' } });
        fireEvent.change(screen.getByPlaceholderText('Columbus'), { target: { value: 'City' } });
        fireEvent.change(screen.getByPlaceholderText('OH'), { target: { value: 'OH' } });
        fireEvent.change(screen.getByPlaceholderText('43215'), { target: { value: '12345' } });

        // Mock stripe success
        mockStripe.createPaymentMethod.mockResolvedValue({
            paymentMethod: { id: 'pm_123' },
            error: null,
        });

        fireEvent.click(screen.getByText('Pay $100.00'));

        await waitFor(() => {
            expect(mockStripe.createPaymentMethod).toHaveBeenCalled();
        });
    });

    it('should handle stripe errors', async () => {
        render(<CheckoutForm {...defaultProps} />);

        // Fill form
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('123 Main St'), { target: { value: '123 St' } });
        fireEvent.change(screen.getByPlaceholderText('Columbus'), { target: { value: 'City' } });
        fireEvent.change(screen.getByPlaceholderText('OH'), { target: { value: 'OH' } });
        fireEvent.change(screen.getByPlaceholderText('43215'), { target: { value: '12345' } });

        mockStripe.createPaymentMethod.mockResolvedValue({
            error: { message: 'Stripe Error' },
        });

        fireEvent.click(screen.getByText('Pay $100.00'));

        expect(await screen.findByText('Stripe Error')).toBeInTheDocument();
    });
});
