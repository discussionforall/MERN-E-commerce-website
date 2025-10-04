import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ICartItem } from '../models/Cart';
import Cart from '../models/Cart';
import Product from '../models/Product';
import User from '../models/User';
import Order from '../models/Order';
import Coupon from '../models/Coupon';

// Initialize Stripe instance
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  });
};

// Create payment intent
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { cartItems, address, totalAmount: requestTotalAmount } = req.body;
    const userId = (req as any).user.id; // Get userId from authenticated user


    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount (use provided totalAmount or calculate from items)
    let totalAmount = requestTotalAmount || 0;
    const lineItems = [];

    // If no totalAmount provided, calculate it
    if (!requestTotalAmount) {
      for (const item of cartItems) {
        const product = await Product.findById(item.product._id);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.product._id} not found` });
        }
        totalAmount += product.price * item.quantity;
      }
    }

    // Validate products and build line items
    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product._id} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
            images: product.imageUrl ? [product.imageUrl] : [],
          },
          unit_amount: Math.round(product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    }

    // Create payment intent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: userId,
        cartItems: JSON.stringify(cartItems.map((item: ICartItem) => ({
          productId: item.product._id,
          quantity: item.quantity
        }))),
        shippingAddress: address ? JSON.stringify(address) : null,
        totalAmount: totalAmount?.toString() || totalAmount.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Error creating payment intent' });
  }
};

// Confirm payment and process order
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Process the order (update stock, create order record, etc.)
    const cartItems = JSON.parse(paymentIntent.metadata.cartItems);
    const userId = paymentIntent.metadata.userId;

    // Update product stock
    for (const item of cartItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], totalItems: 0, totalAmount: 0 }
    );

    res.status(200).json({
      message: 'Payment confirmed and order processed',
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
};

// Webhook handler for Stripe events
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;


  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.created':
      const createdPaymentIntent = event.data.object as Stripe.PaymentIntent;
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        // Process the order
        const cartItems = JSON.parse(paymentIntent.metadata.cartItems);
        const userId = paymentIntent.metadata.userId;
        const shippingAddress = paymentIntent.metadata.shippingAddress ? 
          JSON.parse(paymentIntent.metadata.shippingAddress) : null;
        const totalAmountFromMetadata = parseFloat(paymentIntent.metadata.totalAmount || '0');


        if (!userId) {
          console.error('No userId found in payment intent metadata:', paymentIntent.metadata);
          return;
        }

        // Fetch product details from database
        const orderItems = [];
        for (const item of cartItems) {
          const product = await Product.findById(item.productId);
          if (!product) {
            console.error('Product not found:', item.productId);
            continue;
          }
          
          orderItems.push({
            product: {
              _id: product._id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              images: product.images || [],
              category: product.category
            },
            quantity: item.quantity,
            price: product.price
          });
        }

        // Calculate totals
        const shipping = totalAmountFromMetadata > 100 ? 0 : 10;
        const tax = totalAmountFromMetadata * 0.08;
        const finalTotal = totalAmountFromMetadata + shipping + tax;

        // Create order
        const order = new Order({
          user: userId,
          items: orderItems,
          shippingAddress: shippingAddress || {
            firstName: 'N/A',
            lastName: 'N/A',
            email: 'N/A',
            phone: 'N/A',
            address: 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: 'N/A',
            country: 'N/A',
            addressType: 'home'
          },
          paymentMethod: 'stripe',
          paymentStatus: 'completed',
          orderStatus: 'pending',
          subtotal: totalAmountFromMetadata,
          shipping: shipping,
          tax: tax,
          total: finalTotal,
          paymentIntentId: paymentIntent.id
        });

        await order.save();

        // Update product stock
        for (const item of cartItems) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } }
          );
        }

        // Clear user's cart (moved to order creation API to avoid conflicts)
        // await Cart.findOneAndDelete({ user: userId });

      } catch (error) {
        console.error('Error processing order from webhook:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      break;

    case 'payment_intent.canceled':
      const canceledPayment = event.data.object as Stripe.PaymentIntent;
      break;

    case 'payment_intent.requires_action':
      const requiresActionPayment = event.data.object as Stripe.PaymentIntent;
      break;

    default:
      // Unhandled event type
  }

  res.status(200).json({ received: true });
};

// Test webhook endpoint
export const testWebhook = async (req: Request, res: Response) => {
  
  res.status(200).json({
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString(),
    received: true
  });
};

// Get payment methods
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get customer's saved payment methods
    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: userId,
      type: 'card',
    });

    res.status(200).json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ message: 'Error getting payment methods' });
  }
};

// Create customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { email, name, userId } = req.body;

    const stripe = getStripe();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId,
      },
    });

    res.status(200).json({ customerId: customer.id });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error creating customer' });
  }
};
