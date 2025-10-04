import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get KPIs
    const [
      totalRevenue,
      totalOrders,
      newCustomers,
      totalProducts,
      orderStatusCounts,
      recentOrders,
      revenueByDate,
      topProducts,
      categoryStats,
    ] = await Promise.all([
      // Total Revenue
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            paymentStatus: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
          },
        },
      ]),

      // Total Orders
      Order.countDocuments({
        createdAt: { $gte: startDate },
        paymentStatus: 'completed',
      }),

      // New Customers
      User.countDocuments({
        createdAt: { $gte: startDate },
        role: 'user',
      }),

      // Total Products
      Product.countDocuments({}),

      // Order Status Distribution
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),

      // Recent Orders (last 10)
      Order.find({
        createdAt: { $gte: startDate },
      })
        .populate('user', 'username email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Revenue by Date (last 7 days)
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
            paymentStatus: 'completed',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),

      // Top Products by Revenue
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            paymentStatus: 'completed',
          },
        },
        {
          $unwind: '$items',
        },
        {
          $group: {
            _id: {
              productId: '$items.product._id',
              productName: '$items.product.name',
            },
            totalRevenue: {
              $sum: { $multiply: ['$items.quantity', '$items.price'] },
            },
            totalQuantity: { $sum: '$items.quantity' },
          },
        },
        {
          $sort: { totalRevenue: -1 },
        },
        {
          $limit: 10,
        },
      ]),

      // Category Statistics
      Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$stock' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
    ]);

    // Get previous period data for comparison
    const previousStartDate = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime())
    );

    const [previousRevenue, previousOrders, previousCustomers] =
      await Promise.all([
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: previousStartDate, $lt: startDate },
              paymentStatus: 'completed',
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
            },
          },
        ]),
        Order.countDocuments({
          createdAt: { $gte: previousStartDate, $lt: startDate },
          paymentStatus: 'completed',
        }),
        User.countDocuments({
          createdAt: { $gte: previousStartDate, $lt: startDate },
          role: 'user',
        }),
      ]);

    // Calculate percentage changes
    const currentRevenue = totalRevenue[0]?.total || 0;
    const prevRevenue = previousRevenue[0]?.total || 0;
    const revenueChange =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : 0;

    const ordersChange =
      previousOrders > 0
        ? ((totalOrders - previousOrders) / previousOrders) * 100
        : 0;
    const customersChange =
      previousCustomers > 0
        ? ((newCustomers - previousCustomers) / previousCustomers) * 100
        : 0;

    // Format data for response
    const analytics = {
      kpis: {
        revenue: {
          value: currentRevenue,
          change: revenueChange,
          type: revenueChange >= 0 ? 'increase' : 'decrease',
        },
        orders: {
          value: totalOrders,
          change: ordersChange,
          type: ordersChange >= 0 ? 'increase' : 'decrease',
        },
        customers: {
          value: newCustomers,
          change: customersChange,
          type: customersChange >= 0 ? 'increase' : 'decrease',
        },
        products: {
          value: totalProducts,
          change: 0, // Products don't change frequently
          type: 'neutral' as const,
        },
      },
      orderStatus: orderStatusCounts.map(item => ({
        name: item._id,
        value: item.count,
        color: getStatusColor(item._id),
      })),
      recentOrders: recentOrders.map(order => ({
        id: order._id,
        customer: `${(order.user as any)?.username || 'Unknown'} (${(order.user as any)?.email || 'N/A'})`,
        amount: order.total,
        status: order.orderStatus,
        date: order.createdAt.toISOString().split('T')[0],
      })),
      revenueData: revenueByDate.map(item => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders,
      })),
      topProducts: topProducts.map(item => ({
        name: item._id.productName,
        sales: item.totalQuantity,
        revenue: item.totalRevenue,
      })),
      categoryStats: categoryStats.map(item => ({
        name: item._id,
        count: item.count,
        stock: item.totalStock,
      })),
    };

    res.json({
      success: true,
      data: analytics,
      period,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Helper function to get status colors
function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered':
      return '#10B981';
    case 'processing':
      return '#F59E0B';
    case 'shipped':
      return '#3B82F6';
    case 'pending':
      return '#EF4444';
    case 'cancelled':
      return '#6B7280';
    default:
      return '#6B7280';
  }
}
