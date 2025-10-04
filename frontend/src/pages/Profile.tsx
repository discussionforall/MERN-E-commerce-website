import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AddressManagement from '../components/AddressManagement';
import AvatarUpload from '../components/AvatarUpload';
import { UploadedImage } from '../hooks/useImageUpload';

const Profile: React.FC = () => {
  const { user, updateProfile, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [profileImage, setProfileImage] = useState<UploadedImage | null>(
    user?.profileImage ? {
      url: user.profileImage.url,
      publicId: user.profileImage.publicId
    } : null
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // Validate form data
      if (!formData.username.trim()) {
        toast.error('Username is required');
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Email is required');
        return;
      }

      // Check if there are any changes
      const hasUsernameChange = formData.username !== user?.username;
      const hasEmailChange = formData.email !== user?.email;
      const hasImageChange = profileImage !== null && (
        !user?.profileImage || 
        profileImage.url !== user.profileImage.url
      );

      if (!hasUsernameChange && !hasEmailChange && !hasImageChange) {
        toast.success('No changes to save');
        setIsEditing(false);
        return;
      }

      // Prepare update data
      const updateData: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
      };

      // Include profile image if it exists
      if (profileImage) {
        updateData.profileImage = {
          url: profileImage.url,
          publicId: profileImage.publicId
        };
      }

      // Call the API to update profile
      await updateProfile(updateData);

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setProfileImage(
      user?.profileImage ? {
        url: user.profileImage.url,
        publicId: user.profileImage.publicId
      } : null
    );
    setIsEditing(false);
  };

  const handleImageChange = (image: UploadedImage | null) => {
    setProfileImage(image);
  };

  // Refresh user profile when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      try {
        await refreshUserProfile();
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    };
    
    loadProfile();
  }, []); // Empty dependency array to run only once on mount

  // Update form data and profileImage state when user changes
  useEffect(() => {
    
    // Update form data
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
    }
    
    // Update profile image
    if (user?.profileImage) {
      setProfileImage({
        url: user.profileImage.url,
        publicId: user.profileImage.publicId
      });
    } else {
      setProfileImage(null);
    }
  }, [user]);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'Customer';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Please log in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
      <div className='bg-white shadow rounded-lg'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-900'>Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors'
              >
                <Edit className='h-4 w-4' />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className='px-6 py-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Profile Picture Section */}
            <div className='lg:col-span-1'>
              <div className='text-center'>
                {isEditing ? (
                  <div className='space-y-4'>
                    <AvatarUpload
                      onImageChange={handleImageChange}
                      existingImage={profileImage || undefined}
                      className="mx-auto"
                    />
                    <p className='text-xs text-gray-500'>
                      Click to upload or drag and drop
                    </p>
                  </div>
                ) : (
                  <div className='mx-auto h-32 w-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden'>
                    {user.profileImage ? (
                      <img
                        src={user.profileImage.url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className='h-16 w-16 text-gray-400' />
                    )}
                  </div>
                )}
                <h3 className='mt-4 text-lg font-medium text-gray-900'>
                  {user.username}
                </h3>
                <p className='text-sm text-gray-500'>{user.email}</p>
                <div className='mt-2'>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                  >
                    <Shield className='h-3 w-3 mr-1' />
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className='lg:col-span-2'>
              <div className='space-y-6'>
                {/* Username */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='username'
                      value={formData.username}
                      onChange={handleInputChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  ) : (
                    <p className='text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md'>
                      {user.username}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  ) : (
                    <p className='text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md'>
                      {user.email}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Account Type
                  </label>
                  <div className='flex items-center space-x-2'>
                    <Shield className='h-4 w-4 text-gray-400' />
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                    >
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                </div>

                {/* Member Since */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Member Since
                  </label>
                  <div className='flex items-center space-x-2'>
                    <Calendar className='h-4 w-4 text-gray-400' />
                    <span className='text-sm text-gray-900'>
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons for Editing */}
                {isEditing && (
                  <div className='flex space-x-3 pt-4'>
                    <button
                      onClick={handleSave}
                      className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors'
                    >
                      <Save className='h-4 w-4' />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                    >
                      <X className='h-4 w-4' />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className='px-6 py-4 bg-gray-50 border-t border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Account Information
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='flex items-center space-x-3'>
              <Mail className='h-5 w-5 text-gray-400' />
              <div>
                <p className='text-sm font-medium text-gray-700'>
                  Email Verified
                </p>
                <p className='text-sm text-gray-500'>Yes</p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <Shield className='h-5 w-5 text-gray-400' />
              <div>
                <p className='text-sm font-medium text-gray-700'>
                  Account Status
                </p>
                <p className='text-sm text-green-600'>Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Management Section */}
      <div className='bg-white rounded-lg shadow-sm'>
        <div className='px-6 py-4'>
          <AddressManagement />
        </div>
      </div>
    </div>
  );
};

export default Profile;
