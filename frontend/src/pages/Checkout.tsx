import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Address, CreateAddressRequest } from '../types';
import { 
  MapPin, 
  User, 
  CreditCard, 
  ArrowLeft,
  ShoppingCart,
  Package,
  Truck,
  Shield,
  Plus,
  Home,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateOrderTotal } from '../utils/orderCalculations';
import { getProductImageUrl } from '../utils/imageUtils';
import OptimizedImage from '../components/OptimizedImage';

interface AddressForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  saveAddress: boolean;
  isDefault: boolean;
}

interface NewAddressForm {
  addressName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, appliedCoupon, discountAmount } = useCart();
  const { user, getUserAddresses, createAddress } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [_checkoutData, setCheckoutData] = useState<any>(null);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [addressFormErrors, setAddressFormErrors] = useState<Partial<NewAddressForm>>({});
  const [formData, setFormData] = useState<AddressForm>({
    firstName: user?.username?.split(' ')[0] || '',
    lastName: user?.username?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    addressName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    saveAddress: false,
    isDefault: false,
  });

  const [newAddressForm, setNewAddressForm] = useState<NewAddressForm>({
    addressName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Partial<AddressForm>>({});

  // Load checkout data from navigation state or localStorage (fallback)
  useEffect(() => {
    const locationState = location.state as any;
    if (locationState?.checkoutData) {
      // Use data from navigation state (buy now flow)
      setCheckoutData(locationState.checkoutData);
      setIsBuyNow(locationState.buyNow || false);
    } else {
      // Fallback to localStorage for backward compatibility
      const savedCheckoutData = localStorage.getItem('checkoutData');
      if (savedCheckoutData) {
        const data = JSON.parse(savedCheckoutData);
        setCheckoutData(data);
        setIsBuyNow(data.buyNow || false);
      }
    }
  }, [location.state]);

  // Load user addresses
  useEffect(() => {
    const loadUserAddresses = async () => {
      try {
        setAddressLoading(true);
        const addresses = await getUserAddresses();
        setUserAddresses(addresses);
        
        // Set default address as selected if available
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
          setFormData(prev => ({
            ...prev,
            address: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            zipCode: defaultAddress.zipCode,
            country: defaultAddress.country,
            phone: defaultAddress.phone || '',
          }));
        }
      } catch (error) {
        console.error('Failed to load user addresses:', error);
      } finally {
        setAddressLoading(false);
      }
    };

    if (user) {
      loadUserAddresses();
    }
  }, [user, getUserAddresses]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressForm> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof AddressForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowNewAddressForm(false);
    
    // Fill form with selected address
    setFormData(prev => ({
      ...prev,
      address: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone || '',
    }));
  };

  const handleNewAddressToggle = () => {
    setShowNewAddressForm(!showNewAddressForm);
    setSelectedAddress(null);
  };

  const handleNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmittingAddress) return; // Prevent double submission
    
    // Clear previous errors
    setAddressFormErrors({});
    
    // Validate required fields
    const errors: Partial<NewAddressForm> = {};
    if (!newAddressForm.addressName?.trim()) errors.addressName = 'Address name is required';
    if (!newAddressForm.street?.trim()) errors.street = 'Street address is required';
    if (!newAddressForm.city?.trim()) errors.city = 'City is required';
    if (!newAddressForm.state?.trim()) errors.state = 'State is required';
    if (!newAddressForm.zipCode?.trim()) errors.zipCode = 'ZIP code is required';
    
    if (Object.keys(errors).length > 0) {
      setAddressFormErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmittingAddress(true);
    try {
      const addressData: CreateAddressRequest = {
        addressName: newAddressForm.addressName,
        street: newAddressForm.street,
        city: newAddressForm.city,
        state: newAddressForm.state,
        zipCode: newAddressForm.zipCode,
        country: newAddressForm.country,
        phone: newAddressForm.phone || undefined,
        isDefault: newAddressForm.isDefault || userAddresses.length === 0,
      };

      await createAddress(addressData);
      
      // Reload addresses
      const addresses = await getUserAddresses();
      setUserAddresses(addresses);
      
      // Set the new address as selected
      const newAddress = addresses.find(addr => addr.addressName === addressData.addressName);
      if (newAddress) {
        handleAddressSelect(newAddress);
        toast.success(`Address "${newAddress.addressName}" has been selected!`);
      } else {
        toast.error('Address created but could not be selected. Please select it manually.');
      }
      
      // Reset new address form
      setNewAddressForm({
        addressName: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
        phone: '',
        isDefault: false,
      });
      
      setShowNewAddressForm(false);
      toast.success(`Address "${addressData.addressName}" saved successfully!`);
    } catch (error: any) {
      console.error('Failed to save address:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save address. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call to save address
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prepare checkout data based on flow type
      let finalCheckoutData;
      
      if (isBuyNow && _checkoutData) {
        // Buy now flow - use the buy now data with address
        finalCheckoutData = {
          ..._checkoutData,
          address: formData,
          appliedCoupon,
          discountAmount: discountAmount || 0,
          timestamp: new Date().toISOString()
        };
      } else {
        // Regular cart flow
        finalCheckoutData = {
          address: formData,
          items: cart?.items || [],
          total: cart?.totalAmount || 0,
          appliedCoupon,
          discountAmount: discountAmount || 0,
          timestamp: new Date().toISOString()
        };
      }
      
      // Store checkout data in localStorage for payment page
      localStorage.setItem('checkoutData', JSON.stringify(finalCheckoutData));
      
      toast.success('Address saved successfully!');
      navigate('/payment', { 
        state: { 
          checkoutData: finalCheckoutData,
          buyNow: isBuyNow,
          productName: location.state?.productName || ''
        }
      });
    } catch (error) {
      toast.error('Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use appropriate data based on flow type
  const items = isBuyNow ? (_checkoutData?.items || []) : (cart?.items || []);
  const totalAmount = isBuyNow ? (_checkoutData?.total || 0) : (cart?.totalAmount || 0);
  const calculations = calculateOrderTotal(totalAmount);

  if ((!isBuyNow && (!cart || cart.items.length === 0)) || (isBuyNow && (!_checkoutData || !_checkoutData.items || _checkoutData.items.length === 0))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart before checkout</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (isBuyNow && _checkoutData?.items?.[0]) {
                // For buy now, go back to the specific product
                navigate(`/product/${_checkoutData.items[0].product.name.toLowerCase().replace(/ /g, '-')}`);
              } else {
                // For regular cart flow, go back to cart
                navigate('/cart');
              }
            }}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {isBuyNow ? 'Back to Product' : 'Back to Cart'}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isBuyNow ? 'Express Checkout' : 'Checkout'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isBuyNow 
              ? 'Complete your purchase by providing your details' 
              : 'Complete your order by providing your details'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Selection Section */}
              {!addressLoading && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-green-600" />
                      Delivery Address
                    </h2>
                    <button
                      type="button"
                      onClick={handleNewAddressToggle}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Address
                    </button>
                  </div>

                  {/* Existing Addresses */}
                  {userAddresses.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Select from saved addresses:</h3>
                      {userAddresses.map((address) => (
                        <div
                          key={address._id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedAddress?._id === address._id
                              ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <input
                                type="radio"
                                name="address"
                                checked={selectedAddress?._id === address._id}
                                onChange={() => handleAddressSelect(address)}
                                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-900">{address.addressName}</span>
                                  {address.isDefault && (
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-700 mt-1">
                                  <p className="font-medium">{address.street}</p>
                                  <p>{address.city}, {address.state} {address.zipCode}</p>
                                  <p>{address.country}</p>
                                  {address.phone && <p className="mt-1">📞 {address.phone}</p>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {address.isDefault && (
                                <Home className="h-4 w-4 text-green-600" />
                              )}
                              {!address.isDefault && (
                                <Building className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Address Form */}
                  {showNewAddressForm && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Address</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Name *
                          </label>
                          <input
                            type="text"
                            value={newAddressForm.addressName}
                            onChange={(e) => setNewAddressForm(prev => ({ ...prev, addressName: e.target.value }))}
                            placeholder="e.g., Home, Office, Mom's House"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              addressFormErrors.addressName 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                            }`}
                          />
                          {addressFormErrors.addressName && (
                            <p className="mt-1 text-sm text-red-600">{addressFormErrors.addressName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            value={newAddressForm.street}
                            onChange={(e) => setNewAddressForm(prev => ({ ...prev, street: e.target.value }))}
                            placeholder="123 Main Street"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              addressFormErrors.street 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                            }`}
                          />
                          {addressFormErrors.street && (
                            <p className="mt-1 text-sm text-red-600">{addressFormErrors.street}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              value={newAddressForm.city}
                              onChange={(e) => setNewAddressForm(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="New York"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                addressFormErrors.city 
                                  ? 'border-red-500 focus:ring-red-500' 
                                  : 'border-gray-300 focus:ring-green-500'
                              }`}
                            />
                            {addressFormErrors.city && (
                              <p className="mt-1 text-sm text-red-600">{addressFormErrors.city}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              value={newAddressForm.state}
                              onChange={(e) => setNewAddressForm(prev => ({ ...prev, state: e.target.value }))}
                              placeholder="NY"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                addressFormErrors.state 
                                  ? 'border-red-500 focus:ring-red-500' 
                                  : 'border-gray-300 focus:ring-green-500'
                              }`}
                            />
                            {addressFormErrors.state && (
                              <p className="mt-1 text-sm text-red-600">{addressFormErrors.state}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ZIP Code *
                            </label>
                            <input
                              type="text"
                              value={newAddressForm.zipCode}
                              onChange={(e) => setNewAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                              placeholder="10001"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                addressFormErrors.zipCode 
                                  ? 'border-red-500 focus:ring-red-500' 
                                  : 'border-gray-300 focus:ring-green-500'
                              }`}
                            />
                            {addressFormErrors.zipCode && (
                              <p className="mt-1 text-sm text-red-600">{addressFormErrors.zipCode}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country *
                            </label>
                            <input
                              type="text"
                              value={newAddressForm.country}
                              onChange={(e) => setNewAddressForm(prev => ({ ...prev, country: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={newAddressForm.phone}
                              onChange={(e) => setNewAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+1 (555) 123-4567"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="setAsDefault"
                            checked={newAddressForm.isDefault}
                            onChange={(e) => setNewAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label htmlFor="setAsDefault" className="ml-2 text-sm font-medium text-gray-900">
                            Set as default address
                          </label>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={handleNewAddressToggle}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingAddress}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNewAddressSubmit(e);
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              isSubmittingAddress
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {isSubmittingAddress ? 'Saving...' : 'Save Address'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show message if no addresses and not adding new one */}
                  {userAddresses.length === 0 && !showNewAddressForm && (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No saved addresses</p>
                      <p className="text-sm">Add an address to get started</p>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Address Form - Only show when no address selected and not adding new address */}
              {!selectedAddress && !showNewAddressForm && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    {selectedAddress ? 'Custom Address Details' : 'Shipping Address'}
                  </h2>
                  
                  {selectedAddress && !showNewAddressForm ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <MapPin className="h-4 w-4 mr-2" />
                        Using selected address above
                      </div>
                    </div>
                  ) : (
                  <>
                    <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your street address"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your city"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your state"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.zipCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter ZIP code"
                    />
                    {errors.zipCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="India">India</option>
                    <option value="Other">Other</option>
                  </select>
                </div>


                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="saveAddress"
                          checked={formData.saveAddress}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        Save this address for future orders
                      </label>
                    </div>
                  </>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item: any) => {
                  // Handle different item structures for buy now vs cart
                  const productName = item.product?.name || item.name;
                  const productPrice = item.product?.price || item.price;
                  const itemKey = item.product?._id || item._id;
                  
                  return (
                    <div key={itemKey} className="flex items-center space-x-4">
                      <OptimizedImage
                        src={getProductImageUrl(item.product || item)}
                        alt={productName}
                        className="w-16 h-16 rounded-lg"
                        width={64}
                        height={64}
                        quality={85}
                        loading="lazy"
                        fallbackIcon={<Package className="h-8 w-8 text-gray-400" />}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 line-clamp-2">{productName}</h3>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-gray-900">${(productPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${calculations.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className={calculations.shipping === 0 ? 'text-green-600' : ''}>
                    {calculations.shipping === 0 ? 'Free' : `$${calculations.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${calculations.tax.toFixed(2)}</span>
                </div>

                {/* Subtotal (Full Amount) */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Subtotal</span>
                    <span>${calculations.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Discount Display */}
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="font-medium">-${(discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}

                {/* Final Total */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-blue-600">
                    <span>Total</span>
                    <span>${(calculations.total - (discountAmount || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Secure
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-1" />
                    Fast Delivery
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
