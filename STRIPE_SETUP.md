# Stripe Payment Gateway Integration

This guide will help you set up Stripe payment gateway integration for your MERN stack application.

## 🔑 Required Credentials

You'll need the following Stripe credentials:

### 1. Stripe API Keys
- **Publishable Key**: `pk_test_...` (for frontend)
- **Secret Key**: `sk_test_...` (for backend)
- **Webhook Secret**: `whsec_...` (for webhook verification)

### 2. How to Get Stripe Credentials

1. **Create Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get API Keys**: 
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to **Developers** → **API keys**
   - Copy your **Publishable key** and **Secret key**

3. **Set Up Webhook**:
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - Set URL to: `http://localhost:5000/api/payments/webhook` (for development)
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **Signing secret**

## 🛠️ Environment Setup

### Backend Configuration

1. **Copy environment template**:
   ```bash
   cp backend/config.env.example backend/config.env
   ```

2. **Update `backend/config.env`**:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/mern-rbac

   # JWT
   JWT_SECRET=your_jwt_secret_key_here

   # Server
   PORT=5000
   NODE_ENV=development

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

### Frontend Configuration

1. **Copy environment template**:
   ```bash
   cp frontend/env.example frontend/.env.local
   ```

2. **Update `frontend/.env.local`**:
   ```env
   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

   # API Base URL
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

## 🚀 Features Implemented

### Backend Features
- ✅ **Payment Intent Creation**: Creates Stripe payment intents
- ✅ **Webhook Handling**: Processes payment confirmations via webhooks
- ✅ **Order Processing**: Updates product stock and clears cart
- ✅ **Customer Management**: Creates and manages Stripe customers
- ✅ **Error Handling**: Comprehensive error handling and logging

### Frontend Features
- ✅ **Stripe Elements**: Secure payment form with Stripe Elements
- ✅ **Payment Page**: Dedicated checkout page with order summary
- ✅ **Success Page**: Payment confirmation page
- ✅ **Cart Integration**: Seamless integration with existing cart system
- ✅ **Responsive Design**: Mobile-friendly payment interface

## 📋 API Endpoints

### Payment Routes (`/api/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-payment-intent` | Create payment intent | Yes |
| POST | `/confirm-payment` | Confirm payment | Yes |
| POST | `/webhook` | Stripe webhook handler | No |
| GET | `/payment-methods/:userId` | Get saved payment methods | Yes |
| POST | `/create-customer` | Create Stripe customer | Yes |

## 🔄 Payment Flow

1. **User adds items to cart**
2. **User clicks "Proceed to Checkout"**
3. **Frontend creates payment intent via backend**
4. **User enters payment details using Stripe Elements**
5. **Payment is processed through Stripe**
6. **Webhook confirms payment and processes order**
7. **User sees success page**

## 🧪 Testing

### Test Card Numbers (Stripe Test Mode)

| Card Number | Description |
|-------------|-------------|
| `4242424242424242` | Visa - Success |
| `4000000000000002` | Visa - Declined |
| `4000000000009995` | Visa - Insufficient funds |
| `5555555555554444` | Mastercard - Success |

**Test Details**:
- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code (e.g., 12345)

## 🔧 Development Commands

```bash
# Start development servers
npm run dev

# Check code quality
npm run check

# Fix code issues
npm run fix
```

## 🚨 Important Notes

### Security
- ✅ **Never expose secret keys** in frontend code
- ✅ **Use environment variables** for all sensitive data
- ✅ **Verify webhook signatures** to prevent fraud
- ✅ **Use HTTPS in production**

### Production Deployment
- Update webhook URL to your production domain
- Use live Stripe keys (not test keys)
- Set up proper error monitoring
- Configure CORS for your production domain

## 📚 Stripe Documentation

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Elements](https://stripe.com/docs/stripe-js/react)
- [Webhook Guide](https://stripe.com/docs/webhooks)
- [Test Cards](https://stripe.com/docs/testing)

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid API Key"**: Check your Stripe keys are correct
2. **"Webhook signature verification failed"**: Verify webhook secret
3. **"CORS errors"**: Check CORS configuration in backend
4. **"Payment not completing"**: Check browser console for errors

### Debug Mode
Enable Stripe debug logging by setting `STRIPE_DEBUG=true` in your backend environment.

## 📞 Support

For Stripe-specific issues:
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://discord.gg/stripe)

For application-specific issues, check the application logs and error messages.
