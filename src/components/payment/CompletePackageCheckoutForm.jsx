import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from '../common/Button/Button';
import styles from './CheckoutForm.module.css';

const CompletePackageCheckoutForm = ({ 
  onSuccess, 
  onError,
  onCancel,
  courseId
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentOption, setPaymentOption] = useState('split');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.state.trim()) {
      setError('State is required');
      return false;
    }
    if (!formData.zipCode.trim()) {
      setError('ZIP code is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.fullName,
          email: formData.email,
          address: {
            line1: formData.address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.zipCode
          },
          phone: formData.phone || undefined
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      console.log('Payment Method Created:', paymentMethod);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      const amount = paymentOption === 'split' ? 99.99 : 549.99;

      if (onSuccess) {
        onSuccess({
          paymentMethodId: paymentMethod.id,
          amount,
          courseId,
          paymentType: paymentOption === 'split' ? 'split' : 'full',
          paymentOption,
          billingDetails: formData
        });
      }
    } catch (err) {
      setError(err.message);
      if (onError) {
        onError(err);
      }
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className={styles.checkoutForm}>
      <div className={styles.formHeader}>
        <h3>Complete Your Enrollment</h3>
        <p className={styles.subtitle}>Fastrack Complete Package</p>
      </div>

      {/* Payment Options */}
      <div className={styles.paymentOptions}>
        <div className={styles.optionGroup}>
          <label className={`${styles.option} ${paymentOption === 'split' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="paymentOption"
              value="split"
              checked={paymentOption === 'split'}
              onChange={(e) => setPaymentOption(e.target.value)}
              disabled={processing}
            />
            <div className={styles.optionContent}>
              <div className={styles.optionTitle}>Split Payment</div>
              <div className={styles.optionDetails}>
                Pay <strong>$99.99 now</strong> to start the online course
                <br />
                <small>Pay remaining $450 after course completion & certificate</small>
              </div>
            </div>
          </label>
        </div>

        <div className={styles.optionGroup}>
          <label className={`${styles.option} ${paymentOption === 'full' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="paymentOption"
              value="full"
              checked={paymentOption === 'full'}
              onChange={(e) => setPaymentOption(e.target.value)}
              disabled={processing}
            />
            <div className={styles.optionContent}>
              <div className={styles.optionTitle}>Pay in Full</div>
              <div className={styles.optionDetails}>
                Pay <strong>$549.99 now</strong> for immediate access to online course
                <br />
                <small>Behind-the-wheel unlocks after online certificate</small>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Billing Information */}
      <div className={styles.billingSection}>
        <h4>Billing Information</h4>
        
        <div className={styles.formGroup}>
          <label htmlFor="fullName">Full Name *</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="John Doe"
            disabled={processing}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john@example.com"
            disabled={processing}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="address">Street Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="123 Main St"
            disabled={processing}
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="city">City *</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Columbus"
              disabled={processing}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="state">State *</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="OH"
              disabled={processing}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="zipCode">ZIP Code *</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              placeholder="43215"
              disabled={processing}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone">Phone Number (optional)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="(614) 555-0000"
            disabled={processing}
          />
        </div>
      </div>

      {/* Card Information */}
      <div className={styles.cardSection}>
        <h4>Card Information</h4>
        <div className={styles.cardElement}>
          <label htmlFor="card-element">Credit or Debit Card *</label>
          <CardElement 
            id="card-element"
            options={cardElementOptions}
          />
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!stripe || processing}
        >
          {processing ? 'Processing...' : `Pay $${(paymentOption === 'split' ? 99.99 : 549.99).toFixed(2)}`}
        </Button>
      </div>

      <div className={styles.secureNote}>
        <span>🔒</span>
        <p>Your payment information is secure and encrypted</p>
      </div>
    </form>
  );
};

export default CompletePackageCheckoutForm;
