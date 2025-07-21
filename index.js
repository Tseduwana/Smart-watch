const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartwatch', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Product = mongoose.model('Product', {
  name: String, price: Number, image: String
});
const Order = mongoose.model('Order', {
  items: Array, total: Number,
  name: String, email: String, address: String, phone: String,
  createdAt: { type: Date, default: Date.now }
});

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'smartwatch123';

async function seed() {
  if (await Product.countDocuments() === 0) {
    const sample = [
      { name: 'SmartWatch X1', price: 99.99, image: 'https://via.placeholder.com/150?text=SmartWatch+X1' },
      { name: 'SmartWatch Pro', price: 149.99, image: 'https://via.placeholder.com/150?text=SmartWatch+Pro' },
      { name: 'Fitness Band Plus', price: 59.99, image: 'https://via.placeholder.com/150?text=Fitness+Band+Plus' },
      { name: 'SmartWatch Lite', price: 79.99, image: 'https://via.placeholder.com/150?text=SmartWatch+Lite' }
    ];
    await Product.create(sample);
  }
}
seed();

app.get('/api/products', async (req, res) => {
  res.json(await Product.find());
});

app.post('/api/orders', async (req, res) => {
  const { items, total, name, email, address, phone } = req.body;
  const order = new Order({ items, total, name, email, address, phone });
  await order.save();
  res.json({ id: order._id });
});

app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) res.json({ ok: true });
  else res.status(401).json({ ok: false });
});

app.get('/api/admin/orders', async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Basic ${Buffer.from(\`\${ADMIN_USER}:\${ADMIN_PASS}\`).toString('base64')}`) {
    return res.status(401).json({ ok: false });
  }
  const orders = await Order.find().sort('-createdAt');
  res.json(orders);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Backend running on port', PORT));