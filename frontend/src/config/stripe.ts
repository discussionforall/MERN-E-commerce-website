import { loadStripe } from '@stripe/stripe-js';

// Get the publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error(
    'VITE_STRIPE_PUBLISHABLE_KEY is not defined in environment variables'
  );
}

// Initialize Stripe
export const stripePromise = loadStripe(stripePublishableKey);

// Stripe configuration
export const stripeConfig = {
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '4px',
    },
  },
  mode: 'payment',
  currency: 'usd',
};
