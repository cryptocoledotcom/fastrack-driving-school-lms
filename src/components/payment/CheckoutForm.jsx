// CheckoutForm Component
// Stripe payment form for processing payments

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from '../common/Button/Button';
import styles from './CheckoutForm.module.css';

const CheckoutForm = ({ 
  amount, 
  courseId, 
  paymentType,
  onSuccess, 
  onError,
  onCancel 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // In production, you would:
      // 1. Call your Cloud Function to create a payment intent
      // 2. Confirm the payment with Stripe
      // 3. Update enrollment status
      
      // For now, simulate successful payment
      console.log('Payment Method Created:', paymentMethod);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onSuccess) {
        onSuccess({
          paymentMethodId: paymentMethod.id,
          amount,
          courseId,
          paymentType
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
        <h3>Payment Details</h3>
        <p className={styles.amount}>Amount: ${(amount / 100).toFixed(2)}</p>
      </div>

      <div className={styles.cardElement}>
        <label htmlFor="card-element">Credit or Debit Card</label>
        <CardElement 
          id="card-element"
          options={cardElementOptions}
        />
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
          {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
        </Button>
      </div>

      <div className={styles.secureNote}>
        <span>🔒</span>
        <p>Your payment information is secure and encrypted</p>
      </div>
    </form>
  );
};

export default CheckoutForm;