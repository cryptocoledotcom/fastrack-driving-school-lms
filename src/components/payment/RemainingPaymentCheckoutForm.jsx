import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button/Button';
import ErrorMessage from '../common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage/SuccessMessage';
import Input from '../common/Input/Input';
import enrollmentServices from '../../api/enrollmentServices';
import styles from './CheckoutForm.module.css';

const RemainingPaymentCheckoutForm = ({
  onSuccess,
  onError,
  onCancel,
  courseId,
  enrollment,
  courseName
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const getTargetCourseId = () => {
    if (enrollment?.parentEnrollmentId) {
      return enrollment.parentEnrollmentId;
    }
    return courseId;
  };
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  });
  
  const REMAINING_AMOUNT = 450;

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Full name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.address.trim()) errors.push('Street address is required');
    if (!formData.city.trim()) errors.push('City is required');
    if (!formData.state.trim()) errors.push('State is required');
    if (!formData.zip.trim()) errors.push('ZIP code is required');
    if (!formData.phone.trim()) errors.push('Phone number is required');

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!stripe || !elements) {
      setErrorMessage('Payment system not initialized');
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(', '));
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);

      const paymentMethodResult = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.name,
          email: formData.email,
          address: {
            line1: formData.address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.zip
          },
          phone: formData.phone
        }
      });

      if (paymentMethodResult.error) {
        throw new Error(paymentMethodResult.error.message);
      }

      const targetCourseId = getTargetCourseId();
      
      // Update parent enrollment
      await enrollmentServices.payRemainingBalance(
        user.uid,
        targetCourseId,
        REMAINING_AMOUNT,
        formData.email
      );

      // Also update the current course enrollment if it's a component of a bundle
      if (enrollment?.parentEnrollmentId && courseId !== targetCourseId) {
        await enrollmentServices.payRemainingBalance(
          user.uid,
          courseId,
          REMAINING_AMOUNT,
          formData.email
        );
      }

      setSuccessMessage('Payment successful! Your course is now unlocked.');
      
      if (onSuccess) {
        onSuccess({
          amount: REMAINING_AMOUNT,
          paymentMethodId: paymentMethodResult.paymentMethod.id,
          courseId,
          paymentType: 'remaining_balance'
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'Payment processing failed. Please try again.');
      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.checkoutForm}>
      <div className={styles.formHeader}>
        <h3>Complete Your Payment</h3>
        <p className={styles.amount}>Amount Due: ${REMAINING_AMOUNT.toFixed(2)}</p>
      </div>

      {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage('')} />}
      {successMessage && <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage('')} />}

      <div className={styles.formSection}>
        <h4 className={styles.sectionTitle}>Billing Information</h4>
        
        <Input
          label="Full Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="John Doe"
          required
          disabled={isProcessing}
          fullWidth
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="your@email.com"
          required
          disabled={isProcessing}
          fullWidth
        />

        <Input
          label="Street Address"
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="123 Main Street"
          required
          disabled={isProcessing}
          fullWidth
        />

        <div className={styles.addressRow}>
          <Input
            label="City"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="City"
            required
            disabled={isProcessing}
          />

          <Input
            label="State"
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="State"
            required
            disabled={isProcessing}
            maxLength={2}
          />

          <Input
            label="ZIP Code"
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleInputChange}
            placeholder="ZIP"
            required
            disabled={isProcessing}
            maxLength={10}
          />
        </div>

        <Input
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="(555) 123-4567"
          required
          disabled={isProcessing}
          fullWidth
        />
      </div>

      <div className={styles.formSection}>
        <h4 className={styles.sectionTitle}>Card Information</h4>
        
        <div className={styles.cardElement}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }
              }
            }}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          loading={isProcessing}
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing Payment...' : `Pay $${REMAINING_AMOUNT.toFixed(2)}`}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="large"
          fullWidth
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default RemainingPaymentCheckoutForm;