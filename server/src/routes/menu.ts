import express from 'express';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

// Get all items for a shop
router.get('/:sellerId', async (req, res) => {
  try {
    const items = await MenuItem.find({ sellerId: req.params.sellerId });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Add menu item
router.post('/', async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update item
router.put('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
