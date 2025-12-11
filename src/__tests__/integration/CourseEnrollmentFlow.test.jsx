import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CheckoutForm from '../../components/payment/CheckoutForm';
import { Elements } from '@stripe/react-stripe-js';

// MOCKS
const mockUser = { uid: 'test-user', email: 'test@example.com' };

// Mock constants
vi.mock('../../constants/courses', () => ({
    COURSE_IDS: {
        BEHIND_WHEEL: 'fastrack-behind-the-wheel',
        COMPLETE: 'fastrack-complete',
        ONLINE: 'fastrack-online'
    },
    PAYMENT_STATUS: {
        COMPLETED: 'completed'
    }
}));

// Mock Stripe Config
vi.mock('../../config/stripe', () => ({
    stripePromise: Promise.resolve({}),
}));

// Mock CSRF
vi.mock('../../utils/security/csrfToken', () => ({
    getCSRFToken: vi.fn().mockReturnValue('mock-token'),
    validateCSRFToken: vi.fn().mockReturnValue(true),
}));

// Mock Auth
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: mockUser }),
}));

// Mock Services
vi.mock('@/api/compliance/schedulingServices');
vi.mock('@/api/courses/courseServices', () => ({
    getCourse: vi.fn(),
    enrollStudentInCourse: vi.fn(),
}));

// Mock Stripe library - BUT maintain Elements export
// We need Elements to actually RENDER children if we use it in the manual render
// However, CheckoutForm uses useStripe hooks.
// Check if we can use the REAL Elements?
// If we use real Elements, we need real Stripe object mock?
// Let's mock the library but provide a working Elements mock that renders children.
vi.mock('@stripe/react-stripe-js', async () => {
    const actual = await vi.importActual('@stripe/react-stripe-js');
    return {
        ...actual,
        Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,
        useStripe: () => ({
            createPaymentMethod: vi.fn().mockResolvedValue({ paymentMethod: { id: 'pm_123' } }),
        }),
        useElements: () => ({
            getElement: vi.fn().mockReturnValue({}), // Return mock element
        }),
        CardElement: () => <div data-testid="card-element">Card Element</div>,
    };
});

// Mock Navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Import after mocking
import { COURSE_IDS } from '../../constants/courses';

describe('Integration: Course Enrollment Flow', () => {
    it('completes the full enrollment payment flow via CheckoutForm', async () => {
        const onEnrollmentSuccess = vi.fn();

        // Render CheckoutForm directly
        render(
            <Elements stripe={Promise.resolve({})}>
                <CheckoutForm
                    amount={350}
                    courseId={COURSE_IDS.BEHIND_WHEEL}
                    courseName="Behind-the-Wheel Instruction"
                    paymentType="full"
                    onSuccess={onEnrollmentSuccess}
                />
            </Elements>
        );

        // Verify Form is Open
        expect(screen.getByText(/Complete Your Payment/i)).toBeInTheDocument();

        const amountDisplays = screen.getAllByText(/\$350/i);
        expect(amountDisplays.length).toBeGreaterThan(0);

        // Fill Form
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test Student' } });
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('123 Main St'), { target: { value: '123 Test Lane' } });
        fireEvent.change(screen.getByPlaceholderText('Columbus'), { target: { value: 'Test City' } });
        fireEvent.change(screen.getByPlaceholderText('OH'), { target: { value: 'OH' } });
        fireEvent.change(screen.getByPlaceholderText('43215'), { target: { value: '99999' } });

        // Submit
        const payButton = screen.getAllByText(/Pay \$350/i)[0];
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(onEnrollmentSuccess).toHaveBeenCalled();
        }, { timeout: 3000 });
    });
});
