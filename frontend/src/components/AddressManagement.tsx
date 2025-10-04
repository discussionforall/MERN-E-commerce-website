import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../types';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const AddressManagement: React.FC = () => {
  const {
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; address: Address | null }>({
    show: false,
    address: null,
  });
  const [formData, setFormData] = useState<CreateAddressRequest>({
    addressName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
    isDefault: false,
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const userAddresses = await getUserAddresses();
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Failed to load addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAddress) {
        // Update existing address
        const updateData: UpdateAddressRequest = {
          addressName: formData.addressName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone || undefined,
          isDefault: formData.isDefault,
        };
        await updateAddress(editingAddress._id, updateData);
        toast.success('Address updated successfully!');
      } else {
        // Create new address
        await createAddress(formData);
        toast.success('Address added successfully!');
      }

      await loadAddresses();
      resetForm();
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('Failed to save address. Please try again.');
    }
  };

  const handleDelete = (address: Address) => {
    setDeleteModal({ show: true, address });
  };

  const confirmDelete = async () => {
    if (!deleteModal.address) return;
    
    try {
      await deleteAddress(deleteModal.address._id);
      toast.success('Address deleted successfully!');
      await loadAddresses();
      setDeleteModal({ show: false, address: null });
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete address. Please try again.');
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, address: null });
  };

  const handleSetDefault = async (address: Address) => {
    try {
      await setDefaultAddress(address._id);
      toast.success('Default address updated!');
      await loadAddresses();
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error('Failed to set default address. Please try again.');
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      addressName: address.addressName,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      addressName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      phone: '',
      isDefault: false,
    });
    setEditingAddress(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className='animate-pulse'>
        <div className='h-8 bg-gray-200 rounded w-1/4 mb-6'></div>
        <div className='space-y-4'>
          {[1, 2, 3].map(i => (
            <div key={i} className='h-32 bg-gray-200 rounded'></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-gray-900 flex items-center'>
          <MapPin className='h-6 w-6 mr-2 text-blue-600' />
          My Addresses
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          <Plus className='h-4 w-4 mr-2' />
          Add Address
        </button>
      </div>

      {/* Address List */}
      {addresses.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {addresses.map(address => (
            <div
              key={address._id}
              className={`border rounded-lg p-4 ${
                address.isDefault
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center'>
                  <span className='font-medium text-gray-900'>
                    {address.addressName}
                  </span>
                  {address.isDefault && (
                    <span className='ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                      Default
                    </span>
                  )}
                </div>
                <div className='flex items-center space-x-2'>
                  {address.isDefault ? (
                    <Home className='h-4 w-4 text-green-600' />
                  ) : (
                    <Building className='h-4 w-4 text-gray-400' />
                  )}
                </div>
              </div>

              <div className='text-sm text-gray-700 mb-4'>
                <p className='font-medium'>{address.street}</p>
                <p>
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p>{address.country}</p>
                {address.phone && <p className='mt-1'>📞 {address.phone}</p>}
              </div>

              <div className='flex items-center space-x-2'>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address)}
                    className='flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors'
                  >
                    <Check className='h-3 w-3 mr-1' />
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className='flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors'
                >
                  <Edit className='h-3 w-3 mr-1' />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address)}
                  className='flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors'
                >
                  <Trash2 className='h-3 w-3 mr-1' />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <MapPin className='h-16 w-16 mx-auto mb-4 text-gray-300' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No addresses yet
          </h3>
          <p className='text-gray-500 mb-4'>
            Add your first address to get started
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Address
          </button>
        </div>
      )}

      {/* Add/Edit Address Form */}
      {showAddForm && (
        <div className='fixed inset-0 backdrop-blur-sm transition-opacity bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-black ring-opacity-5 transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-semibold text-gray-900'>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={resetForm}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='h-6 w-6' />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Address Name *
                </label>
                <input
                  type='text'
                  value={formData.addressName}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      addressName: e.target.value,
                    }))
                  }
                  placeholder="e.g., Home, Office, Mom's House"
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Street Address *
                </label>
                <input
                  type='text'
                  value={formData.street}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, street: e.target.value }))
                  }
                  placeholder='123 Main Street'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    City *
                  </label>
                  <input
                    type='text'
                    value={formData.city}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, city: e.target.value }))
                    }
                    placeholder='New York'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    State *
                  </label>
                  <input
                    type='text'
                    value={formData.state}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, state: e.target.value }))
                    }
                    placeholder='NY'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    ZIP Code *
                  </label>
                  <input
                    type='text'
                    value={formData.zipCode}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        zipCode: e.target.value,
                      }))
                    }
                    placeholder='10001'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Country *
                  </label>
                  <input
                    type='text'
                    value={formData.country}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder='+1 (555) 123-4567'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='isDefault'
                  checked={formData.isDefault}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isDefault: e.target.checked,
                    }))
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label
                  htmlFor='isDefault'
                  className='ml-2 text-sm font-medium text-gray-900'
                >
                  Set as default address
                </label>
              </div>

              <div className='flex justify-end space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={resetForm}
                  className='px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.address && (
        <div className='fixed inset-0 backdrop-blur-sm transition-opacity bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md shadow-2xl ring-1 ring-black ring-opacity-5 transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle'>
            <div className='flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full'>
              <Trash2 className='h-6 w-6 text-red-600' />
            </div>
            
            <div className='text-center'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Delete Address
              </h3>
              <p className='text-sm text-gray-500 mb-6'>
                Are you sure you want to delete "{deleteModal.address.addressName}"? This action cannot be undone.
              </p>
              
              <div className='flex justify-center space-x-3'>
                <button
                  onClick={cancelDelete}
                  className='px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManagement;
