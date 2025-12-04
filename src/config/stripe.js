// Stripe Configuration
// This file contains Stripe initialization and configuration

import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key
// In production, use environment variable
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SUtdlFqT72Uaf78YrNlJbMsCwxQnDrGFAsRNKAxFJ5pY70xjMhc1GsIl0BloT0JL88ph1e5xNE6EX2Lg4reVN0100ve6AvzqS'
);

// Stripe configuration
export const STRIPE_CONFIG = {
  // Currency
  currency: 'usd',
  
  // Payment method types
  paymentMethodTypes: ['card'],
  
  // Billing details collection
  billingAddressCollection: 'auto',
  
  // Shipping address collection (set to false for digital products)
  shippingAddressCollection: false
};

export default stripePromise;