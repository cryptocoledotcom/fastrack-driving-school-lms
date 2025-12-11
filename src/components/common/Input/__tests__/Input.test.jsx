import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Input from '../Input';

describe('Input', () => {
    it('renders with label correctly', () => {
        render(<Input label="Username" name="username" />);
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('handles changes', () => {
        const handleChange = vi.fn();
        render(<Input label="Test" name="test" onChange={handleChange} />);

        const input = screen.getByLabelText('Test');
        fireEvent.change(input, { target: { value: 'hello' } });

        expect(handleChange).toHaveBeenCalled();
    });

    it('shows error message and applies invalid state', () => {
        render(<Input label="Email" name="email" error="Invalid email" />);

        const input = screen.getByLabelText('Email');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('shows helper text', () => {
        render(<Input label="Password" name="password" helperText="Min 8 chars" />);
        expect(screen.getByText('Min 8 chars')).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
        const ref = React.createRef();
        render(<Input name="test" ref={ref} />);

        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
});
