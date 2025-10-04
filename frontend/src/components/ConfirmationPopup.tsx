import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200',
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          border: 'border-blue-200',
        };
      default:
        return {
          icon: 'text-yellow-500',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          border: 'border-yellow-200',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 backdrop-blur-sm bg-opacity-20'
        onClick={onClose}
      />

      {/* Popup */}
      <div className='relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all ring-1 ring-black'>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${styles.border}`}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
              <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className='px-6 py-4'>
          <p className='text-gray-600'>{message}</p>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
