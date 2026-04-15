import express from 'express';
import Order from '../models/Order.js';
import Seller from '../models/Seller.js';

const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const { sellerId, customerName, customerPhone, items, totalAmount, paymentMethod, paymentStatus } = req.body;
    
    // Get next token number
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });
    
    seller.tokenSequence += 1;
    const tokenNumber = seller.tokenSequence;
    await seller.save();

    const order = new Order({
      tokenNumber,
      customerName,
      customerPhone,
      items,
      totalAmount,
      sellerId,
      paymentMethod: paymentMethod || 'Online',
      paymentStatus: paymentStatus || 'Paid'
    });

    await order.save();

    // Emit socket event to seller
    const io = req.app.get('io');
    io.to(sellerId.toString()).emit('new-order', order);

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Emit update to shop (both customer and seller can listen)
    const io = req.app.get('io');
    io.to(order.sellerId.toString()).emit('order-status-updated', order);

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get orders for a seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('sellerId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get orders for a specific shop
router.get('/shop/:sellerId', async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.params.sellerId });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Rate an order
router.post('/:id/rate', async (req, res) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5) is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.rating) return res.status(400).json({ message: 'Order already rated' });

    order.rating = rating;
    order.review = review;
    await order.save();

    // Update Seller stats
    const seller = await Seller.findById(order.sellerId);
    if (seller) {
      const totalScore = (seller.avgRating * seller.totalRatings) + rating;
      seller.totalRatings += 1;
      seller.avgRating = Number((totalScore / seller.totalRatings).toFixed(1));
      await seller.save();
    }

    res.json({ message: 'Rating submitted successfully', order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment status (e.g. mark as Paid at Counter)
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    io.to(order.sellerId.toString()).emit('order-status-updated', order);

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
