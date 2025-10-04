import { Request, Response } from 'express';
import Address, { IAddress } from '../models/Address';
import { CreateAddressRequest, UpdateAddressRequest } from '../types';

// Get all addresses for a user
export const getUserAddresses = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const addresses = await Address.find({ userId: user._id }).sort({
      isDefault: -1, // Default address first
      createdAt: -1, // Then by creation date (newest first)
    });

    res.json({
      addresses,
      total: addresses.length,
    });
  } catch (error) {
    console.error('Get user addresses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new address
export const createAddress = async (
  req: Request<{}, {}, CreateAddressRequest>,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const {
      addressName,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault,
    } = req.body;

    // Validate required fields
    if (!addressName || !street || !city || !state || !zipCode || !country) {
      return res.status(400).json({
        message:
          'Address name, street, city, state, zip code, and country are required',
      });
    }

    // Check if this will be the default address
    const shouldBeDefault = isDefault === true;

    // If this is set as default, remove default flag from other addresses
    if (shouldBeDefault) {
      await Address.updateMany({ userId: user._id }, { isDefault: false });
    }

    // If no default address exists and this is the first address, make it default
    const existingAddresses = await Address.countDocuments({
      userId: user._id,
    });
    const makeDefault = shouldBeDefault || existingAddresses === 0;

    // Create new address
    const newAddress = new Address({
      userId: user._id,
      addressName,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault: makeDefault,
    });

    await newAddress.save();

    res.status(201).json({
      message: 'Address created successfully',
      address: newAddress,
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update an address
export const updateAddress = async (
  req: Request<{ id: string }, {}, UpdateAddressRequest>,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const updateData = req.body;

    // Find the address and verify ownership
    const address = await Address.findOne({ _id: id, userId: user._id });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, remove default flag from other addresses
    if (updateData.isDefault === true) {
      await Address.updateMany(
        { userId: user._id, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    // Update the address
    const updatedAddress = await Address.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: 'Address updated successfully',
      address: updatedAddress,
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete an address
export const deleteAddress = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Find the address and verify ownership
    const address = await Address.findOne({ _id: id, userId: user._id });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Delete the address
    await Address.findByIdAndDelete(id);

    // If this was the default address, make another address default
    if (address.isDefault) {
      const remainingAddress = await Address.findOne({ userId: user._id });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    res.json({
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Set default address
export const setDefaultAddress = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Find the address and verify ownership
    const address = await Address.findOne({ _id: id, userId: user._id });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Remove default flag from all addresses
    await Address.updateMany({ userId: user._id }, { isDefault: false });

    // Set the selected address as default
    address.isDefault = true;
    await address.save();

    res.json({
      message: 'Default address updated successfully',
      address,
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
