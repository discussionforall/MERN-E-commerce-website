import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
        {/* Background overlay */}
        <div
          className='fixed inset-0 backdrop-blur-sm transition-opacity'
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className='relative inline-block transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-2xl ring-1 ring-black ring-opacity-5 transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle'>
          <div className='bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6'>
            <div className='sm:flex sm:items-start'>
              <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-50 sm:mx-0 sm:h-12 sm:w-12'>
                <AlertTriangle className='h-6 w-6 text-red-500' />
              </div>
              <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                <h3 className='text-xl font-semibold leading-6 text-gray-900'>
                  {title}
                </h3>
                <div className='mt-3'>
                  <p className='text-sm leading-6 text-gray-600'>{message}</p>
                  {itemName && (
                    <div className='mt-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200'>
                      <p className='text-sm font-medium text-gray-900'>
                        "{itemName}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className='bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 sm:py-6'>
            <button
              type='button'
              onClick={onConfirm}
              disabled={isLoading}
              className='inline-flex w-full justify-center rounded-lg border border-transparent bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:ml-3 sm:w-auto'
            >
              {isLoading ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Deleting...
                </div>
              ) : (
                <div className='flex items-center'>
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </div>
              )}
            </button>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:mt-0 sm:ml-3 sm:w-auto'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
