import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Seller from '../models/Seller.js';
import QRCode from 'qrcode';

const router = express.Router();

// Generate a unique short code: 1 uppercase letter + 3 digits (e.g., B743)
async function generateShortCode(): Promise<string> {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // skip I and O (look like 1 and 0)
  let code: string;
  let attempts = 0;
  do {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const digits = String(Math.floor(Math.random() * 900) + 100); // 100-999
    code = `${letter}${digits}`;
    const existing = await Seller.findOne({ shortCode: code });
    if (!existing) break;
    attempts++;
  } while (attempts < 20);
  return code!;
}


router.post('/register', async (req, res) => {
  try {
    const { shopName, ownerName, phone, email, password, category, location, upiId } = req.body;
    
    let seller = await Seller.findOne({ email });
    if (seller) return res.status(400).json({ message: 'Seller already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const shortCode = await generateShortCode();
    
    seller = new Seller({
      shopName,
      ownerName,
      phone,
      email,
      password: hashedPassword,
      category,
      location,
      upiId,
      shortCode,
      isPhoneVerified: true
    });

    // Generate QR Code pointing to the shop page
    const shopUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop/${seller._id}`;
    const qrDataUrl = await QRCode.toDataURL(shopUrl);
    seller.qrCode = qrDataUrl;

    await seller.save();

    const token = jwt.sign({ id: seller._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.status(201).json({ token, seller });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await Seller.findOne({ email });
    if (!seller) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, seller.password || '');
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });


    const token = jwt.sign({ id: seller._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, seller });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get shop details by Mongo ID
router.get('/shop/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).select('-password');
    if (!seller) return res.status(404).json({ message: 'Shop not found' });
    
    // Check subscription status
    const now = new Date();
    if (seller.subscriptionStatus === 'Trial' && seller.trialEndsAt < now) {
      seller.subscriptionStatus = 'Expired';
      await seller.save();
    }
    
    res.json(seller);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Search shops by shortCode OR shopName (for customer landing page)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.json([]);
    }
    const query = q.trim();

    // First: try exact short code match (case-insensitive)
    const byCode = await Seller.findOne({
      shortCode: { $regex: `^${query}$`, $options: 'i' }
    }).select('-password');

    if (byCode) {
      return res.json([byCode]); // exact match → return immediately
    }

    // Otherwise: search by shop name (fuzzy, case-insensitive)
    const byName = await Seller.find({
      shopName: { $regex: query, $options: 'i' }
    }).select('-password').limit(8);

    res.json(byName);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update shop details
router.patch('/shop/:id', async (req, res) => {
  try {
    const { shopName, ownerName, phone, location, upiId } = req.body;
    const seller = await Seller.findByIdAndUpdate(
      req.params.id, 
      { shopName, ownerName, phone, location, upiId }, 
      { new: true }
    ).select('-password');
    
    if (!seller) return res.status(404).json({ message: 'Shop not found' });
    res.json(seller);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
