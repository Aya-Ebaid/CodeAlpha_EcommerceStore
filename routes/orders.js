const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', async (req, res) => {
  const { items, address } = req.body;

  if (!address || !address.trim()) {
    return res.status(400).json({ error: 'Shipping address is required.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const wanted = new Map();
  for (const item of items) {
    const qty = Number(item.quantity);
    if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ error: 'Invalid item in cart.' });
    }
    wanted.set(item.productId, (wanted.get(item.productId) || 0) + qty);
  }

  const reserved = [];
  const lines = [];

  try {
    for (const [id, qty] of wanted) {
      const product = await Product.findOneAndUpdate(
        { _id: id, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!product) {
        const existing = await Product.findById(id);
        const err = new Error(
          existing
            ? `Only ${existing.stock} left of "${existing.name}".`
            : 'One of the products no longer exists.'
        );
        err.status = existing ? 409 : 404;
        throw err;
      }

      reserved.push({ id, qty });
      lines.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
      });
    }

    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    const order = await Order.create({
      user: req.user._id,
      items: lines,
      total: Math.round(total * 100) / 100,
      address: address.trim(),
    });

    res.status(201).json(order);
  } catch (err) {
    await Promise.all(
      reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } }))
    );
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Could not place the order.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Could not load your orders.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Could not load the order.' });
  }
});

module.exports = router;