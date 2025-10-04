export interface OrderCalculation {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export const calculateOrderTotal = (subtotal: number): OrderCalculation => {
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
  };
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};
