import { Request, Response } from 'express';
import Product from '../models/Product';
import { ProductRequest } from '../types';
import { getSocketIO } from '../services/socketService';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export const createProduct = async (
  req: Request<{}, {}, ProductRequest>,
  res: Response
) => {
  try {
    const { name, description, price, category, imageUrl, images, cloudinaryPublicId, stock } = req.body;
    const createdBy = (req as any).user._id;

    const product = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      images,
      cloudinaryPublicId,
      stock,
      createdBy,
    });

    await product.save();

    // Populate the createdBy field for the response
    const populatedProduct = await Product.findById(product._id).populate(
      'createdBy',
      'username'
    );

    // Emit Socket.io event for real-time updates
    try {
      const io = getSocketIO();
      // Emit to all connected clients for product updates
      io.emit('product:created', populatedProduct);
      // Emit to admins for analytics
      io.to('admin').emit('analytics:updated', { type: 'product_created', data: { productId: populatedProduct?._id, category: populatedProduct?.category } });
    } catch (error) {
      console.error('Socket.IO not available for product created event:', error);
    }

    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search, 
      availability, 
      sortBy = 'newest',
      minPrice,
      maxPrice
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (category) {
      // Case-insensitive category matching
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search) {
      // Escape special regex characters and create word boundary regex
      const escapedSearch = (search as string).replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      const searchRegex = new RegExp(`\\b${escapedSearch}`, 'i'); // Word boundary + case-insensitive
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    // Availability filter
    if (availability === 'in-stock') {
      query.stock = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
      query.stock = { $lte: 0 };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sort options
    let sortOptions: any = {};
    switch (sortBy) {
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popularity':
        // For now, sort by creation date. In future, can be based on order count
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate('createdBy', 'username')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if the id is a valid MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let product;
    
    if (isObjectId) {
      // If it's a valid ObjectId, search by _id
      product = await Product.findById(id).populate(
        'createdBy',
        'username'
      );
    } else {
      // If it's not a valid ObjectId, treat it as a name-based slug
      // Convert slug back to name format (replace hyphens with spaces and capitalize)
      const nameFromSlug = id
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Try multiple search strategies for better matching
      product = await Product.findOne({
        $or: [
          // Exact match (case-insensitive)
          { name: { $regex: new RegExp(`^${nameFromSlug}$`, 'i') } },
          // Partial match (case-insensitive) - in case of slight differences
          { name: { $regex: new RegExp(nameFromSlug.replace(/\s+/g, '\\s*'), 'i') } },
          // Match with original slug format
          { name: { $regex: new RegExp(`^${id.replace(/-/g, '\\s*')}$`, 'i') } }
        ]
      }).populate(
        'createdBy',
        'username'
      );
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, imageUrl, images, cloudinaryPublicId, stock } = req.body;
    const userId = (req as any).user._id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is admin or the creator
    if (
      (req as any).user.role !== 'admin' &&
      product.createdBy.toString() !== userId
    ) {
      return res
        .status(403)
        .json({
          message: 'Access denied. You can only update your own products.',
        });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, description, price, category, imageUrl, images, cloudinaryPublicId, stock },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    // Emit Socket.io event for real-time updates
    try {
      const io = getSocketIO();
      // Emit to all connected clients for product updates
      io.emit('product:updated', updatedProduct);
      // Emit to admins for analytics
      io.to('admin').emit('analytics:updated', { type: 'product_updated', data: { productId: updatedProduct?._id, category: updatedProduct?.category } });
    } catch (error) {
      console.error('Socket.IO not available for product updated event:', error);
    }

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is admin or the creator
    if (
      (req as any).user.role !== 'admin' &&
      product.createdBy.toString() !== userId
    ) {
      return res
        .status(403)
        .json({
          message: 'Access denied. You can only delete your own products.',
        });
    }

    await Product.findByIdAndDelete(id);

    // Emit Socket.io event for real-time updates
    try {
      const io = getSocketIO();
      // Emit to all connected clients for product updates
      io.emit('product:deleted', id);
      // Emit to admins for analytics
      io.to('admin').emit('analytics:updated', { type: 'product_deleted', data: { productId: id } });
    } catch (error) {
      console.error('Socket.IO not available for product deleted event:', error);
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments({ createdBy: userId });

    res.json({
      products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all unique categories (deprecated - use /api/categories instead)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get search suggestions
export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || (q as string).length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = (q as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(`\\b${searchTerm}`, 'i');

    // Get product name suggestions
    const productSuggestions = await Product.find({
      name: searchRegex
    })
    .select('name')
    .limit(5)
    .lean();

    // Get category suggestions
    const categorySuggestions = await Product.find({
      category: searchRegex
    })
    .distinct('category')
    .limit(3);

    // Combine and format suggestions
    const suggestions = [
      ...productSuggestions.map(p => ({ type: 'product', value: p.name })),
      ...categorySuggestions.map(c => ({ type: 'category', value: c }))
    ];

    res.json({ suggestions });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Configure multer for CSV file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Export products to CSV
export const exportProductsToCSV = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({})
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found to export' });
    }

    // Define CSV headers
    const headers = [
      'Name',
      'Description', 
      'Price',
      'Category',
      'Stock',
      'Image URL',
      'Primary Image URL',
      'All Image URLs',
      'Created By',
      'Created At'
    ];

    // Transform products for CSV export
    const csvData = products.map(product => ({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      imageUrl: product.imageUrl || '',
      primaryImageUrl: product.images?.find(img => img.isPrimary)?.url || '',
      allImageUrls: product.images?.map(img => img.url).join(';') || '',
      createdBy: (product.createdBy as any)?.username || '',
      createdAt: new Date(product.createdAt).toISOString(),
    }));

    // Generate CSV content manually
    let csvContent = headers.join(',') + '\n';
    
    csvData.forEach(row => {
      const csvRow = [
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.description.replace(/"/g, '""')}"`,
        row.price,
        `"${row.category}"`,
        row.stock,
        `"${row.imageUrl}"`,
        `"${row.primaryImageUrl}"`,
        `"${row.allImageUrls}"`,
        `"${row.createdBy}"`,
        `"${row.createdAt}"`
      ];
      csvContent += csvRow.join(',') + '\n';
    });
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
    
    // Send CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Export products to CSV error:', error);
    res.status(500).json({ message: 'Failed to export products to CSV' });
  }
};

// Import products from CSV
export const importProductsFromCSV = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const createdBy = (req as any).user._id;
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Parse CSV file with proper options
    const csvData: any[] = [];
    const stream = Readable.from(req.file.buffer);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser({
          headers: true, // Use first row as headers
        }))
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', resolve)
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          reject(error);
        });
    });

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed

      try {

        // Check if row has any data
        const hasData = Object.values(row).some(value => value && value.toString().trim() !== '');
        if (!hasData) {
          continue;
        }

        // Validate required fields - check both original and trimmed values
        // The CSV parser is using _0, _1, _2... format instead of proper headers
        // Based on the error logs, the mapping seems to be off by one:
        // _0=Name, _1=Description, _2=Price, _3=Category, _4=Stock
        const name = row.Name || row.name || row._0;
        const description = row.Description || row.description || row._1;
        const price = row.Price || row.price || row._2;
        const category = row.Category || row.category || row._3;
        const stock = row.Stock || row.stock || row._4;

        if (!name || !description || !price || !category || !stock) {
          results.failed++;
          results.errors.push(`Row ${rowNumber}: Missing required fields. Found: name=${!!name}, description=${!!description}, price=${!!price}, category=${!!category}, stock=${!!stock}`);
          continue;
        }

        // Validate data types - skip if price is literally "Price" (header row)
        if (price.toString().toLowerCase() === 'price') {
          continue;
        }

        const priceNum = parseFloat(price.toString());
        const stockNum = parseInt(stock.toString());
        
        if (isNaN(priceNum) || priceNum < 0) {
          results.failed++;
          results.errors.push(`Row ${rowNumber}: Invalid price value: ${price}`);
          continue;
        }

        if (isNaN(stockNum) || stockNum < 0) {
          results.failed++;
          results.errors.push(`Row ${rowNumber}: Invalid stock value: ${stock}`);
          continue;
        }

        // Validate category
        const validCategories = ['electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'other'];
        if (!validCategories.includes(category.toString().toLowerCase())) {
          results.failed++;
          results.errors.push(`Row ${rowNumber}: Invalid category "${category}". Must be one of: ${validCategories.join(', ')}`);
          continue;
        }

        // Prepare product data
        const productData: any = {
          name: name.toString().trim(),
          description: description.toString().trim(),
          price: priceNum,
          category: category.toString().toLowerCase(),
          stock: stockNum,
          createdBy: createdBy,
        };

        // Handle imageUrl if provided
        const imageUrl = row['Image URL'] || row.imageUrl || row._5;
        if (imageUrl && imageUrl.toString().trim() && imageUrl.toString().toLowerCase() !== 'image url') {
          productData.imageUrl = imageUrl.toString().trim();
        }

        // Handle images if provided
        const primaryImageUrl = row['Primary Image URL'] || row.primaryImageUrl || row._6;
        const allImageUrls = row['All Image URLs'] || row.allImageUrls || row._7;

        // Only add images if we have valid URLs and they're not header values
        if (primaryImageUrl && primaryImageUrl.toString().trim() && 
            primaryImageUrl.toString().toLowerCase() !== 'primary image url') {
          productData.images = [{
            url: primaryImageUrl.toString().trim(),
            publicId: 'imported-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9), // Generate a unique publicId
            alt: productData.name,
            isPrimary: true,
          }];
        } else if (allImageUrls && allImageUrls.toString().trim() && 
                   allImageUrls.toString().toLowerCase() !== 'all image urls') {
          const imageUrls = allImageUrls.toString().split(';').filter((url: string) => url.trim());
          productData.images = imageUrls.map((url: string, index: number) => ({
            url: url.trim(),
            publicId: 'imported-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + index,
            alt: `${productData.name} - Image ${index + 1}`,
            isPrimary: index === 0,
          }));
        }

        // If no images are provided, ensure we have at least an imageUrl for validation
        if (!productData.imageUrl && (!productData.images || productData.images.length === 0)) {
          // Set a placeholder imageUrl to satisfy the validation requirement
          productData.imageUrl = 'https://via.placeholder.com/400x300?text=No+Image';
        }

        // Create product
        const product = new Product(productData);
        await product.save();

        results.success++;

        // Note: Individual product:created events are emitted after bulk import completion
        // to avoid overwhelming the frontend during CSV import

      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`Error processing row ${rowNumber}:`, error);
      }
    }

    // Emit bulk import completion event
    try {
      const io = getSocketIO();
      io.emit('products:bulk_imported', {
        success: results.success,
        failed: results.failed,
        total: csvData.length,
        message: `Bulk import completed. ${results.success} products imported successfully, ${results.failed} failed.`
      });
      
      // Also emit to admins for analytics
      io.to('admin').emit('analytics:updated', { 
        type: 'products_bulk_imported', 
        data: { 
          success: results.success, 
          failed: results.failed, 
          total: csvData.length 
        } 
      });
    } catch (error) {
      console.error('Socket.IO not available for bulk import event:', error);
    }

    res.json({
      message: `Import completed. ${results.success} products imported successfully, ${results.failed} failed.`,
      results,
    });

  } catch (error) {
    console.error('Import products from CSV error:', error);
    res.status(500).json({ message: 'Failed to import products from CSV' });
  }
};

// Get CSV template
export const getCSVTemplate = async (req: Request, res: Response) => {
  try {
    // Define CSV headers
    const headers = [
      'Name',
      'Description', 
      'Price',
      'Category',
      'Stock',
      'Image URL',
      'Primary Image URL',
      'All Image URLs',
      'Created By',
      'Created At'
    ];

    // Sample data for template
    const templateData = [
      {
        name: 'Sample Product',
        description: 'This is a sample product description',
        price: '99.99',
        category: 'electronics',
        stock: '10',
        imageUrl: 'https://example.com/image.jpg',
        primaryImageUrl: 'https://example.com/primary-image.jpg',
        allImageUrls: 'https://example.com/image1.jpg;https://example.com/image2.jpg',
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
      },
    ];

    // Generate CSV content manually
    let csvContent = headers.join(',') + '\n';
    
    templateData.forEach(row => {
      const csvRow = [
        `"${row.name}"`,
        `"${row.description}"`,
        row.price,
        `"${row.category}"`,
        row.stock,
        `"${row.imageUrl}"`,
        `"${row.primaryImageUrl}"`,
        `"${row.allImageUrls}"`,
        `"${row.createdBy}"`,
        `"${row.createdAt}"`
      ];
      csvContent += csvRow.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products_template.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Get CSV template error:', error);
    res.status(500).json({ message: 'Failed to generate CSV template' });
  }
};

// Export multer configuration
export { upload };
