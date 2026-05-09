// const express = require('express');
// const path = require('path');
// const fs = require('fs');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const { randomUUID } = require('crypto');
// const mongoose =  require('mongoose');

// dotenv.config();

// const app = express();
// const PORT = Number(process.env.PORT || 5000);
// const JWT_SECRET = process.env.JWT_SECRET || 'piyush-watch-dev-secret';
// const ROOT_DIR = path.resolve(__dirname, '..');
// const DATA_DIR = path.join(__dirname, 'data');
// const DATA_FILE = path.join(DATA_DIR, 'data.json');
// const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');

// fs.mkdirSync(DATA_DIR, { recursive: true });
// fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static(UPLOAD_DIR));
// app.use(express.static(ROOT_DIR));

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
//   filename: (_req, file, cb) => {
//     const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
//     cb(null, `${Date.now()}-${safeName}`);
//   }
// });
// const upload = multer({ storage });

// function makeId() {
//   return randomUUID().replace(/-/g, '').slice(0, 24);
// }

// function nowPlusMinutes(minutes) {
//   return Date.now() + minutes * 60 * 1000;
// }

// function generateOtp() {
//   return String(Math.floor(100000 + Math.random() * 900000));
// }

// function readDb() {
//   if (!fs.existsSync(DATA_FILE)) {
//     return null;
//   }
//   return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
// }

// function writeDb(db) {
//   fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
// }

// function buildSeedProducts() {
//   const items = [
//     { name: 'G-Shock Rangeman GW-9400', brand: 'G-Shock', price: 25999 },
//     { name: 'Edifice Chronograph EFR-539', brand: 'Edifice', price: 12999 },
//     { name: 'Oceanus Classic OCW-T200', brand: 'Oceanus', price: 45999 },
//     { name: 'Pro Trek PRG-340', brand: 'Pro Trek', price: 21999 },
//     { name: 'Databank DBC-32', brand: 'Databank', price: 4499 }
//   ];
//   return items.map((p) => ({
//     _id: makeId(),
//     ...p,
//     imageUrl: '',
//     imageUrls: []
//   }));
// }

// function ensureDb() {
//   let db = readDb();
//   if (db) return db;

//   const adminPasswordHash = bcrypt.hashSync('admin123', 10);
//   db = {
//     users: [
//       {
//         _id: makeId(),
//         name: 'Admin',
//         mobileNumber: '9999999999',
//         email: 'admin@piyushwatch.com',
//         passwordHash: adminPasswordHash,
//         role: 'admin',
//         active: true,
//         verified: true,
//         otp: null,
//         otpExpiry: null,
//         resetOtp: null,
//         resetOtpExpiry: null,
//         createdAt: new Date().toISOString()
//       }
//     ],
//     products: buildSeedProducts(),
//     carts: [],
//     orders: []
//   };
//   writeDb(db);
//   return db;
// }

// function publicUser(user) {
//   return {
//     _id: user._id,
//     name: user.name,
//     email: user.email,
//     mobileNumber: user.mobileNumber,
//     role: user.role,
//     active: user.active,
//     verified: user.verified
//   };
// }

// function auth(req, res, next) {
//   const header = req.headers.authorization || '';
//   const token = header.startsWith('Bearer ') ? header.slice(7) : '';
//   if (!token) return res.status(401).json({ message: 'Unauthorized' });
//   try {
//     const payload = jwt.verify(token, JWT_SECRET);
//     const db = ensureDb();
//     const user = db.users.find((u) => u._id === payload.userId);
//     if (!user || !user.active) return res.status(401).json({ message: 'Unauthorized' });
//     req.user = user;
//     next();
//   } catch {
//     return res.status(401).json({ message: 'Invalid token' });
//   }
// }

// function adminOnly(req, res, next) {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Admin access required' });
//   }
//   next();
// }

// function getCart(db, userId) {
//   let cart = db.carts.find((c) => c.userId === userId);
//   if (!cart) {
//     cart = { userId, items: [] };
//     db.carts.push(cart);
//   }
//   return cart;
// }

// function cartResponse(db, cart) {
//   const items = cart.items
//     .map((it) => {
//       const product = db.products.find((p) => p._id === it.productId);
//       if (!product) return null;
//       return {
//         productId: it.productId,
//         quantity: it.quantity,
//         product,
//         lineTotal: Number(product.price) * Number(it.quantity)
//       };
//     })
//     .filter(Boolean);

//   const cartTotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
//   return { items, cartTotal };
// }

// function hydrateOrderItems(db, items) {
//   return items
//     .map((it) => {
//       const product = db.products.find((p) => p._id === it.productId);
//       if (!product) return null;
//       return {
//         productId: product._id,
//         name: product.name,
//         brand: product.brand,
//         price: Number(product.price),
//         quantity: Number(it.quantity)
//       };
//     })
//     .filter(Boolean);
// }

// app.post('/api/auth/register', async (req, res) => {
//   const { name, mobileNumber, email, password } = req.body || {};
//   if (!name || !mobileNumber || !email || !password) {
//     return res.status(400).json({ message: 'All fields are required.' });
//   }
//   if (String(password).length < 6) {
//     return res.status(400).json({ message: 'Password must be at least 6 characters.' });
//   }

//   const db = ensureDb();
//   const normalizedEmail = String(email).toLowerCase().trim();
//   const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
//   if (existing) return res.status(400).json({ message: 'Email already registered.' });

//   const otp = generateOtp();
//   const user = {
//     _id: makeId(),
//     name: String(name).trim(),
//     mobileNumber: String(mobileNumber).trim(),
//     email: normalizedEmail,
//     passwordHash: await bcrypt.hash(password, 10),
//     role: 'user',
//     active: false,
//     verified: false,
//     otp,
//     otpExpiry: nowPlusMinutes(10),
//     resetOtp: null,
//     resetOtpExpiry: null,
//     createdAt: new Date().toISOString()
//   };
//   db.users.push(user);
//   writeDb(db);
//   return res.json({ message: 'Registered. Verify OTP to continue.', otp });
// });

// app.post('/api/auth/verify-otp', (req, res) => {
//   const { email, otp } = req.body || {};
//   if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

//   const db = ensureDb();
//   const normalizedEmail = String(email).toLowerCase().trim();
//   const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
//   if (!user) return res.status(404).json({ message: 'User not found.' });
//   if (!user.otp || String(user.otp) !== String(otp)) {
//     return res.status(400).json({ message: 'Invalid OTP.' });
//   }
//   if (Date.now() > Number(user.otpExpiry || 0)) {
//     return res.status(400).json({ message: 'OTP expired.' });
//   }

//   user.verified = true;
//   user.active = true;
//   user.otp = null;
//   user.otpExpiry = null;
//   writeDb(db);
//   return res.json({ message: 'Account verified successfully.' });
// });

// app.post('/api/auth/login', async (req, res) => {
//   const { email, password } = req.body || {};
//   if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

//   const db = ensureDb();
//   const normalizedEmail = String(email).toLowerCase().trim();
//   const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
//   if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
//   if (!user.verified) return res.status(401).json({ message: 'Please verify OTP before login.' });
//   if (!user.active) return res.status(403).json({ message: 'Account is inactive.' });

//   const ok = await bcrypt.compare(password, user.passwordHash);
//   if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

//   const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
//   return res.json({ token });
// });

// app.get('/api/auth/me', auth, (req, res) => {
//   res.json({ user: publicUser(req.user) });
// });

// app.post('/api/auth/forgot-password', (req, res) => {
//   const { email } = req.body || {};
//   if (!email) return res.status(400).json({ message: 'Email is required.' });
//   const db = ensureDb();
//   const normalizedEmail = String(email).toLowerCase().trim();
//   const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
//   if (!user) return res.status(404).json({ message: 'User not found.' });

//   const otp = generateOtp();
//   user.resetOtp = otp;
//   user.resetOtpExpiry = nowPlusMinutes(10);
//   writeDb(db);
//   return res.json({ message: 'OTP sent for password reset.', otp });
// });

// app.post('/api/auth/reset-password', async (req, res) => {
//   const { email, otp, newPassword } = req.body || {};
//   if (!email || !otp || !newPassword) {
//     return res.status(400).json({ message: 'Email, OTP and new password are required.' });
//   }
//   if (String(newPassword).length < 6) {
//     return res.status(400).json({ message: 'Password must be at least 6 characters.' });
//   }

//   const db = ensureDb();
//   const normalizedEmail = String(email).toLowerCase().trim();
//   const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
//   if (!user) return res.status(404).json({ message: 'User not found.' });
//   if (!user.resetOtp || String(user.resetOtp) !== String(otp)) {
//     return res.status(400).json({ message: 'Invalid OTP.' });
//   }
//   if (Date.now() > Number(user.resetOtpExpiry || 0)) {
//     return res.status(400).json({ message: 'OTP expired.' });
//   }

//   user.passwordHash = await bcrypt.hash(newPassword, 10);
//   user.resetOtp = null;
//   user.resetOtpExpiry = null;
//   writeDb(db);
//   return res.json({ message: 'Password reset successful.' });
// });

// app.get('/api/products/brands', (_req, res) => {
//   const db = ensureDb();
//   const brands = [...new Set(db.products.map((p) => p.brand))].sort();
//   res.json({ brands });
// });

// app.get('/api/products', (req, res) => {
//   const db = ensureDb();
//   const brand = String(req.query.brand || '').trim().toLowerCase();
//   const search = String(req.query.search || '').trim().toLowerCase();

//   let products = [...db.products];
//   if (brand) products = products.filter((p) => p.brand.toLowerCase() === brand);
//   if (search) {
//     products = products.filter((p) =>
//       `${p.name} ${p.brand}`.toLowerCase().includes(search)
//     );
//   }
//   res.json({ products });
// });

// app.get('/api/products/:id', (req, res) => {
//   const db = ensureDb();
//   const product = db.products.find((p) => p._id === req.params.id);
//   if (!product) return res.status(404).json({ message: 'Product not found.' });
//   return res.json({ product });
// });

// app.get('/api/cart', auth, (req, res) => {
//   const db = ensureDb();
//   const cart = getCart(db, req.user._id);
//   return res.json(cartResponse(db, cart));
// });

// app.post('/api/cart/add', auth, (req, res) => {
//   const { productId, quantity } = req.body || {};
//   if (!productId) return res.status(400).json({ message: 'Product ID required.' });
//   const qty = Math.max(1, Number(quantity || 1));

//   const db = ensureDb();
//   const product = db.products.find((p) => p._id === productId);
//   if (!product) return res.status(404).json({ message: 'Product not found.' });

//   const cart = getCart(db, req.user._id);
//   const line = cart.items.find((it) => it.productId === productId);
//   if (line) line.quantity += qty;
//   else cart.items.push({ productId, quantity: qty });
//   writeDb(db);
//   return res.json({ message: 'Added to cart.' });
// });

// app.post('/api/cart/update', auth, (req, res) => {
//   const { productId, quantity } = req.body || {};
//   if (!productId) return res.status(400).json({ message: 'Product ID required.' });

//   const db = ensureDb();
//   const cart = getCart(db, req.user._id);
//   const qty = Number(quantity);
//   cart.items = cart.items.filter((it) => it.productId !== productId);
//   if (qty > 0) cart.items.push({ productId, quantity: qty });
//   writeDb(db);
//   return res.json({ message: 'Cart updated.' });
// });

// app.post('/api/orders/checkout', auth, (req, res) => {
//   const { deliveryAddress, paymentMethod, items } = req.body || {};
//   if (!deliveryAddress) {
//     return res.status(400).json({ message: 'Delivery address is required.' });
//   }

//   const db = ensureDb();
//   const cart = getCart(db, req.user._id);
//   const requestedItems = Array.isArray(items) && items.length > 0 ? items : cart.items;
//   if (!requestedItems.length) return res.status(400).json({ message: 'No items to checkout.' });

//   const orderItems = hydrateOrderItems(db, requestedItems);
//   if (!orderItems.length) return res.status(400).json({ message: 'Invalid order items.' });

//   const totalPrice = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
//   const order = {
//     _id: makeId(),
//     userId: req.user._id,
//     items: orderItems,
//     totalPrice,
//     paymentMethod: paymentMethod || 'COD',
//     deliveryAddress: String(deliveryAddress).trim(),
//     status: 'Placed',
//     createdAt: new Date().toISOString()
//   };
//   db.orders.unshift(order);

//   if (!Array.isArray(items) || items.length === 0) {
//     cart.items = [];
//   }

//   writeDb(db);
//   return res.json({ message: 'Order placed successfully.', order });
// });

// app.get('/api/orders/me', auth, (req, res) => {
//   const db = ensureDb();
//   const orders = db.orders.filter((o) => o.userId === req.user._id);
//   return res.json({ orders });
// });

// app.post('/api/admin/products', auth, adminOnly, upload.array('images', 5), (req, res) => {
//   const { name, brand, price } = req.body || {};
//   if (!name || !brand || !price) {
//     return res.status(400).json({ message: 'Name, brand, and price are required.' });
//   }

//   const files = req.files || [];
//   const imageUrls = files.map((f) => `/uploads/${f.filename}`);
//   const db = ensureDb();
//   const product = {
//     _id: makeId(),
//     name: String(name).trim(),
//     brand: String(brand).trim(),
//     price: Number(price),
//     imageUrl: imageUrls[0] || '',
//     imageUrls
//   };
//   db.products.unshift(product);
//   writeDb(db);
//   return res.json({ message: 'Product created.', product });
// });

// app.patch('/api/admin/products/:id', auth, adminOnly, upload.array('images', 5), (req, res) => {
//   const db = ensureDb();
//   const product = db.products.find((p) => p._id === req.params.id);
//   if (!product) return res.status(404).json({ message: 'Product not found.' });

//   const { name, brand, price } = req.body || {};
//   if (name) product.name = String(name).trim();
//   if (brand) product.brand = String(brand).trim();
//   if (price !== undefined) product.price = Number(price);

//   const files = req.files || [];
//   if (files.length) {
//     const imageUrls = files.map((f) => `/uploads/${f.filename}`);
//     product.imageUrls = imageUrls;
//     product.imageUrl = imageUrls[0];
//   }
//   writeDb(db);
//   return res.json({ message: 'Product updated.', product });
// });

// app.delete('/api/admin/products/:id', auth, adminOnly, (req, res) => {
//   const db = ensureDb();
//   const prev = db.products.length;
//   db.products = db.products.filter((p) => p._id !== req.params.id);
//   if (db.products.length === prev) {
//     return res.status(404).json({ message: 'Product not found.' });
//   }
//   writeDb(db);
//   return res.json({ message: 'Product deleted.' });
// });

// app.get('/api/admin/users', auth, adminOnly, (_req, res) => {
//   const db = ensureDb();
//   const users = db.users.map(publicUser);
//   res.json({ users });
// });

// app.patch('/api/admin/users/:id', auth, adminOnly, (req, res) => {
//   const { active } = req.body || {};
//   const db = ensureDb();
//   const user = db.users.find((u) => u._id === req.params.id);
//   if (!user) return res.status(404).json({ message: 'User not found.' });
//   if (user.role === 'admin') return res.status(400).json({ message: 'Cannot modify admin status.' });
//   user.active = Boolean(active);
//   writeDb(db);
//   return res.json({ message: 'User updated.', user: publicUser(user) });
// });

// app.get('/api/admin/orders', auth, adminOnly, (_req, res) => {
//   const db = ensureDb();
//   const orders = db.orders.map((order) => {
//     const user = db.users.find((u) => u._id === order.userId);
//     return { order, user: user ? publicUser(user) : null };
//   });
//   res.json({ orders });
// });

// app.patch('/api/admin/orders/:id/status', auth, adminOnly, (req, res) => {
//   const { status } = req.body || {};
//   const allowed = ['Placed', 'Shipped', 'Delivered', 'Cancelled'];
//   if (!allowed.includes(status)) {
//     return res.status(400).json({ message: 'Invalid status.' });
//   }
//   const db = ensureDb();
//   const order = db.orders.find((o) => o._id === req.params.id);
//   if (!order) return res.status(404).json({ message: 'Order not found.' });
//   order.status = status;
//   writeDb(db);
//   return res.json({ message: 'Order status updated.', order });
// });

// app.get('/api/health', (_req, res) => {
//   res.json({ ok: true, service: 'piyush-watch-api' });
// });

// app.use((req, res, next) => {
//   if (req.method !== 'GET') return next();
//   if (req.path.startsWith('/api')) return next();
//   const requested = path.join(ROOT_DIR, req.path);
//   if (fs.existsSync(requested) && fs.statSync(requested).isFile()) return res.sendFile(requested);
//   return res.sendFile(path.join(ROOT_DIR, 'index.html'));
// });

// ensureDb();
// app.listen(PORT, () => {
//   console.log(`Piyush Watch server running on http://localhost:${PORT}`);
//   console.log('Default admin login: admin@piyushwatch.com / admin123');
// });





// const express = require('express');
// const path = require('path');
// const fs = require('fs');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const mongoose = require('mongoose');

// dotenv.config();

// const app = express();

// const PORT = Number(process.env.PORT || 5000);
// const JWT_SECRET = process.env.JWT_SECRET || 'piyush-watch-dev-secret';

// const ROOT_DIR = path.resolve(__dirname, '..');
// const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');

// fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB Connected'))
//   .catch((err) => console.log(err));

// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static(UPLOAD_DIR));
// app.use(express.static(ROOT_DIR));

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
//   filename: (_req, file, cb) => {
//     const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
//     cb(null, `${Date.now()}-${safeName}`);
//   }
// });

// const upload = multer({ storage });

// function nowPlusMinutes(minutes) {
//   return Date.now() + minutes * 60 * 1000;
// }

// function generateOtp() {
//   return String(Math.floor(100000 + Math.random() * 900000));
// }

// /* =========================
//    MODELS
// ========================= */

// const userSchema = new mongoose.Schema(
//   {
//     name: String,
//     mobileNumber: String,
//     email: {
//       type: String,
//       unique: true
//     },
//     passwordHash: String,
//     role: {
//       type: String,
//       default: 'user'
//     },
//     active: {
//       type: Boolean,
//       default: false
//     },
//     verified: {
//       type: Boolean,
//       default: false
//     },
//     otp: String,
//     otpExpiry: Number,
//     resetOtp: String,
//     resetOtpExpiry: Number
//   },
//   { timestamps: true }
// );

// const productSchema = new mongoose.Schema(
//   {
//     name: String,
//     brand: String,
//     price: Number,
//     imageUrl: String,
//     imageUrls: [String]
//   },
//   { timestamps: true }
// );

// const cartSchema = new mongoose.Schema({
//   userId: mongoose.Schema.Types.ObjectId,
//   items: [
//     {
//       productId: mongoose.Schema.Types.ObjectId,
//       quantity: Number
//     }
//   ]
// });

// const orderSchema = new mongoose.Schema(
//   {
//     userId: mongoose.Schema.Types.ObjectId,
//     items: Array,
//     totalPrice: Number,
//     paymentMethod: String,
//     deliveryAddress: String,
//     status: String
//   },
//   { timestamps: true }
// );

// const User = mongoose.model('User', userSchema);
// const Product = mongoose.model('Product', productSchema);
// const Cart = mongoose.model('Cart', cartSchema);
// const Order = mongoose.model('Order', orderSchema);

// /* =========================
//    HELPERS
// ========================= */

// function publicUser(user) {
//   return {
//     _id: user._id,
//     name: user.name,
//     email: user.email,
//     mobileNumber: user.mobileNumber,
//     role: user.role,
//     active: user.active,
//     verified: user.verified
//   };
// }

// async function getCart(userId) {
//   let cart = await Cart.findOne({ userId });

//   if (!cart) {
//     cart = await Cart.create({
//       userId,
//       items: []
//     });
//   }

//   return cart;
// }

// async function cartResponse(cart) {
//   const items = [];

//   for (const it of cart.items) {
//     const product = await Product.findById(it.productId);

//     if (product) {
//       items.push({
//         productId: it.productId,
//         quantity: it.quantity,
//         product,
//         lineTotal: Number(product.price) * Number(it.quantity)
//       });
//     }
//   }

//   const cartTotal = items.reduce((sum, it) => sum + it.lineTotal, 0);

//   return {
//     items,
//     cartTotal
//   };
// }

// async function hydrateOrderItems(items) {
//   const result = [];

//   for (const it of items) {
//     const product = await Product.findById(it.productId);

//     if (product) {
//       result.push({
//         productId: product._id,
//         name: product.name,
//         brand: product.brand,
//         price: Number(product.price),
//         quantity: Number(it.quantity)
//       });
//     }
//   }

//   return result;
// }

// /* =========================
//    AUTH
// ========================= */

// async function auth(req, res, next) {
//   const header = req.headers.authorization || '';

//   const token = header.startsWith('Bearer ')
//     ? header.slice(7)
//     : '';

//   if (!token) {
//     return res.status(401).json({
//       message: 'Unauthorized'
//     });
//   }

//   try {
//     const payload = jwt.verify(token, JWT_SECRET);

//     const user = await User.findById(payload.userId);

//     if (!user || !user.active) {
//       return res.status(401).json({
//         message: 'Unauthorized'
//       });
//     }

//     req.user = user;

//     next();
//   } catch {
//     return res.status(401).json({
//       message: 'Invalid token'
//     });
//   }
// }

// function adminOnly(req, res, next) {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({
//       message: 'Admin access required'
//     });
//   }

//   next();
// }

// /* =========================
//    AUTH ROUTES
// ========================= */

// app.post('/api/auth/register', async (req, res) => {
//   try {
//     const { name, mobileNumber, email, password } = req.body || {};

//     if (!name || !mobileNumber || !email || !password) {
//       return res.status(400).json({
//         message: 'All fields are required.'
//       });
//     }

//     if (String(password).length < 6) {
//       return res.status(400).json({
//         message: 'Password must be at least 6 characters.'
//       });
//     }

//     const normalizedEmail = String(email).toLowerCase().trim();

//     const existing = await User.findOne({
//       email: normalizedEmail
//     });

//     if (existing) {
//       return res.status(400).json({
//         message: 'Email already registered.'
//       });
//     }

//     const otp = generateOtp();

//     await User.create({
//       name: String(name).trim(),
//       mobileNumber: String(mobileNumber).trim(),
//       email: normalizedEmail,
//       passwordHash: await bcrypt.hash(password, 10),
//       role: 'user',
//       active: false,
//       verified: false,
//       otp,
//       otpExpiry: nowPlusMinutes(10)
//     });

//     return res.json({
//       message: 'Registered. Verify OTP to continue.',
//       otp
//     });
//   } catch (err) {
//     res.status(500).json({
//       message: err.message
//     });
//   }
// });

// app.post('/api/auth/verify-otp', async (req, res) => {
//   try {
//     const { email, otp } = req.body || {};

//     const normalizedEmail = String(email).toLowerCase().trim();

//     const user = await User.findOne({
//       email: normalizedEmail
//     });

//     if (!user) {
//       return res.status(404).json({
//         message: 'User not found.'
//       });
//     }

//     if (!user.otp || String(user.otp) !== String(otp)) {
//       return res.status(400).json({
//         message: 'Invalid OTP.'
//       });
//     }

//     if (Date.now() > Number(user.otpExpiry || 0)) {
//       return res.status(400).json({
//         message: 'OTP expired.'
//       });
//     }

//     user.verified = true;
//     user.active = true;
//     user.otp = null;
//     user.otpExpiry = null;

//     await user.save();

//     return res.json({
//       message: 'Account verified successfully.'
//     });
//   } catch (err) {
//     res.status(500).json({
//       message: err.message
//     });
//   }
// });

// app.post('/api/auth/login', async (req, res) => {
//   try {
//     const { email, password } = req.body || {};

//     const normalizedEmail = String(email).toLowerCase().trim();

//     const user = await User.findOne({
//       email: normalizedEmail
//     });

//     if (!user) {
//       return res.status(401).json({
//         message: 'Invalid credentials.'
//       });
//     }

//     if (!user.verified) {
//       return res.status(401).json({
//         message: 'Please verify OTP before login.'
//       });
//     }

//     if (!user.active) {
//       return res.status(403).json({
//         message: 'Account is inactive.'
//       });
//     }

//     const ok = await bcrypt.compare(password, user.passwordHash);

//     if (!ok) {
//       return res.status(401).json({
//         message: 'Invalid credentials.'
//       });
//     }

//     const token = jwt.sign(
//       {
//         userId: user._id
//       },
//       JWT_SECRET,
//       {
//         expiresIn: '7d'
//       }
//     );

//     return res.json({ token });
//   } catch (err) {
//     res.status(500).json({
//       message: err.message
//     });
//   }
// });

// app.get('/api/auth/me', auth, (req, res) => {
//   res.json({
//     user: publicUser(req.user)
//   });
// });

// /* =========================
//    PRODUCTS
// ========================= */

// app.get('/api/products/brands', async (_req, res) => {
//   const brands = await Product.distinct('brand');

//   res.json({
//     brands: brands.sort()
//   });
// });

// app.get('/api/products', async (req, res) => {
//   const brand = String(req.query.brand || '')
//     .trim()
//     .toLowerCase();

//   const search = String(req.query.search || '')
//     .trim()
//     .toLowerCase();

//   let query = {};

//   if (brand) {
//     query.brand = new RegExp(`^${brand}$`, 'i');
//   }

//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: 'i' } },
//       { brand: { $regex: search, $options: 'i' } }
//     ];
//   }

//   const products = await Product.find(query);

//   res.json({ products });
// });

// app.get('/api/products/:id', async (req, res) => {
//   const product = await Product.findById(req.params.id);

//   if (!product) {
//     return res.status(404).json({
//       message: 'Product not found.'
//     });
//   }

//   return res.json({ product });
// });

// /* =========================
//    CART
// ========================= */

// app.get('/api/cart', auth, async (req, res) => {
//   const cart = await getCart(req.user._id);

//   return res.json(await cartResponse(cart));
// });

// app.post('/api/cart/add', auth, async (req, res) => {
//   const { productId, quantity } = req.body || {};

//   const qty = Math.max(1, Number(quantity || 1));

//   const product = await Product.findById(productId);

//   if (!product) {
//     return res.status(404).json({
//       message: 'Product not found.'
//     });
//   }

//   const cart = await getCart(req.user._id);

//   const line = cart.items.find(
//     (it) => String(it.productId) === String(productId)
//   );

//   if (line) {
//     line.quantity += qty;
//   } else {
//     cart.items.push({
//       productId,
//       quantity: qty
//     });
//   }

//   await cart.save();

//   return res.json({
//     message: 'Added to cart.'
//   });
// });

// /* =========================
//    ORDERS
// ========================= */

// app.post('/api/orders/checkout', auth, async (req, res) => {
//   const { deliveryAddress, paymentMethod, items } = req.body || {};

//   const cart = await getCart(req.user._id);

//   const requestedItems =
//     Array.isArray(items) && items.length > 0
//       ? items
//       : cart.items;

//   const orderItems = await hydrateOrderItems(requestedItems);

//   const totalPrice = orderItems.reduce(
//     (sum, it) => sum + it.price * it.quantity,
//     0
//   );

//   const order = await Order.create({
//     userId: req.user._id,
//     items: orderItems,
//     totalPrice,
//     paymentMethod: paymentMethod || 'COD',
//     deliveryAddress,
//     status: 'Placed'
//   });

//   cart.items = [];

//   await cart.save();

//   return res.json({
//     message: 'Order placed successfully.',
//     order
//   });
// });

// /* =========================
//    ADMIN PRODUCTS
// ========================= */

// app.post(
//   '/api/admin/products',
//   auth,
//   adminOnly,
//   upload.array('images', 5),
//   async (req, res) => {
//     const { name, brand, price } = req.body || {};

//     const files = req.files || [];

//     const imageUrls = files.map(
//       (f) => `/uploads/${f.filename}`
//     );

//     const product = await Product.create({
//       name,
//       brand,
//       price: Number(price),
//       imageUrl: imageUrls[0] || '',
//       imageUrls
//     });

//     return res.json({
//       message: 'Product created.',
//       product
//     });
//   }
// );

// /* =========================
//    HEALTH
// ========================= */

// app.get('/api/health', (_req, res) => {
//   res.json({
//     ok: true,
//     service: 'piyush-watch-api'
//   });
// });

// /* =========================
//    FRONTEND
// ========================= */

// app.use((req, res, next) => {
//   if (req.method !== 'GET') return next();

//   if (req.path.startsWith('/api')) return next();

//   const requested = path.join(ROOT_DIR, req.path);

//   if (
//     fs.existsSync(requested) &&
//     fs.statSync(requested).isFile()
//   ) {
//     return res.sendFile(requested);
//   }

//   return res.sendFile(
//     path.join(ROOT_DIR, 'index.html')
//   );
// });

// /* =========================
//    DEFAULT ADMIN
// ========================= */

// async function createAdmin() {
//   const existing = await User.findOne({
//     email: 'admin@piyushwatch.com'
//   });

//   if (!existing) {
//     const passwordHash = await bcrypt.hash(
//       'admin123',
//       10
//     );

//     await User.create({
//       name: 'Admin',
//       mobileNumber: '9999999999',
//       email: 'admin@piyushwatch.com',
//       passwordHash,
//       role: 'admin',
//       active: true,
//       verified: true
//     });

//     console.log('Default admin created');
//   }
// }

// createAdmin();

// /* =========================
//    START SERVER
// ========================= */

// app.listen(PORT, () => {
//   console.log(
//     `Piyush Watch server running on http://localhost:${PORT}`
//   );

//   console.log(
//     'Default admin login: admin@piyushwatch.com / admin123'
//   );
// });





















const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 5000);

/* =========================
   JWT SECRET FIX
========================= */

const JWT_SECRET =
  process.env.JWT_SECRET || 'piyush-watch-dev-secret';

/* =========================
   PATHS
========================= */

const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* =========================
   MONGODB CONNECTION
========================= */

mongoose
  .connect(
    process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/piyush_watch'
  )
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch((err) => {
    console.log('MongoDB Error:', err.message);
  });

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(
  express.json({
    limit: '10mb'
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use('/uploads', express.static(UPLOAD_DIR));

app.use(express.static(ROOT_DIR));

/* =========================
   MULTER
========================= */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9.\-_]/g,
      '_'
    );

    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

/* =========================
   HELPERS
========================= */

function nowPlusMinutes(minutes) {
  return Date.now() + minutes * 60 * 1000;
}

function generateOtp() {
  return String(
    Math.floor(100000 + Math.random() * 900000)
  );
}

/* =========================
   MODELS
========================= */

const userSchema = new mongoose.Schema(
  {
    name: String,

    mobileNumber: String,

    email: {
      type: String,
      unique: true
    },

    passwordHash: String,

    role: {
      type: String,
      default: 'user'
    },

    active: {
      type: Boolean,
      default: false
    },

    verified: {
      type: Boolean,
      default: false
    },

    otp: String,

    otpExpiry: Number,

    resetOtp: String,

    resetOtpExpiry: Number
  },
  {
    timestamps: true
  }
);

const productSchema = new mongoose.Schema(
  {
    name: String,

    brand: String,

    price: Number,

    imageUrl: String,

    imageUrls: [String]
  },
  {
    timestamps: true
  }
);

const cartSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,

    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,

        quantity: Number
      }
    ]
  },
  {
    timestamps: true
  }
);

const orderSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,

    items: Array,

    totalPrice: Number,

    paymentMethod: String,

    deliveryAddress: String,

    status: String
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

const Product = mongoose.model(
  'Product',
  productSchema
);

const Cart = mongoose.model('Cart', cartSchema);

const Order = mongoose.model('Order', orderSchema);

/* =========================
   HELPERS
========================= */

function publicUser(user) {
  return {
    _id: user._id,

    name: user.name,

    email: user.email,

    mobileNumber: user.mobileNumber,

    role: user.role,

    active: user.active,

    verified: user.verified
  };
}

async function getCart(userId) {
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: []
    });
  }

  return cart;
}

async function cartResponse(cart) {
  const items = [];

  for (const it of cart.items) {
    const product = await Product.findById(
      it.productId
    );

    if (product) {
      items.push({
        productId: it.productId,

        quantity: it.quantity,

        product,

        lineTotal:
          Number(product.price) *
          Number(it.quantity)
      });
    }
  }

  const cartTotal = items.reduce(
    (sum, it) => sum + it.lineTotal,
    0
  );

  return {
    items,
    cartTotal
  };
}

async function hydrateOrderItems(items) {
  const result = [];

  for (const it of items) {
    const product = await Product.findById(
      it.productId
    );

    if (product) {
      result.push({
        productId: product._id,

        name: product.name,

        brand: product.brand,

        price: Number(product.price),

        quantity: Number(it.quantity),

        imageUrl: product.imageUrl || ''
      });
    }
  }

  return result;
}

/* =========================
   AUTH MIDDLEWARE
========================= */

async function auth(req, res, next) {
  try {
    const header =
      req.headers.authorization || '';

    const token = header.startsWith(
      'Bearer '
    )
      ? header.slice(7)
      : '';

    if (!token) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }

    const payload = jwt.verify(
      token,
      JWT_SECRET
    );

    const user = await User.findById(
      payload.userId
    );

    if (!user || !user.active) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required'
    });
  }

  next();
}

/* =========================
   AUTH ROUTES
========================= */

app.post(
  '/api/auth/register',
  async (req, res) => {
    try {
      const {
        name,
        mobileNumber,
        email,
        password
      } = req.body || {};

      if (
        !name ||
        !mobileNumber ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            'All fields are required.'
        });
      }

      if (
        String(password).length < 6
      ) {
        return res.status(400).json({
          message:
            'Password must be at least 6 characters.'
        });
      }

      const normalizedEmail = String(
        email
      )
        .toLowerCase()
        .trim();

      const existing =
        await User.findOne({
          email: normalizedEmail
        });

      if (existing) {
        return res.status(400).json({
          message:
            'Email already registered.'
        });
      }

      const otp = generateOtp();

      await User.create({
        name: String(name).trim(),

        mobileNumber: String(
          mobileNumber
        ).trim(),

        email: normalizedEmail,

        passwordHash:
          await bcrypt.hash(
            password,
            10
          ),

        role: 'user',

        active: false,

        verified: false,

        otp,

        otpExpiry:
          nowPlusMinutes(10)
      });

      return res.json({
        message:
          'Registered successfully.',

        otp
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

app.post(
  '/api/auth/verify-otp',
  async (req, res) => {
    try {
      const { email, otp } =
        req.body || {};

      const normalizedEmail = String(
        email
      )
        .toLowerCase()
        .trim();

      const user =
        await User.findOne({
          email: normalizedEmail
        });

      if (!user) {
        return res.status(404).json({
          message: 'User not found.'
        });
      }

      if (
        !user.otp ||
        String(user.otp) !==
          String(otp)
      ) {
        return res.status(400).json({
          message: 'Invalid OTP.'
        });
      }

      if (
        Date.now() >
        Number(user.otpExpiry || 0)
      ) {
        return res.status(400).json({
          message: 'OTP expired.'
        });
      }

      user.verified = true;

      user.active = true;

      user.otp = null;

      user.otpExpiry = null;

      await user.save();

      return res.json({
        message:
          'Account verified successfully.'
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

app.post(
  '/api/auth/login',
  async (req, res) => {
    try {
      const { email, password } =
        req.body || {};

      const normalizedEmail = String(
        email
      )
        .toLowerCase()
        .trim();

      const user =
        await User.findOne({
          email: normalizedEmail
        });

      if (!user) {
        return res.status(401).json({
          message:
            'Invalid credentials.'
        });
      }

      if (!user.verified) {
        return res.status(401).json({
          message:
            'Please verify OTP first.'
        });
      }

      if (!user.active) {
        return res.status(403).json({
          message:
            'Account inactive.'
        });
      }

      const ok =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!ok) {
        return res.status(401).json({
          message:
            'Invalid credentials.'
        });
      }

      const token = jwt.sign(
        {
          userId: user._id
        },
        JWT_SECRET,
        {
          expiresIn: '7d'
        }
      );

      return res.json({
        token,
        user: publicUser(user)
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

app.get(
  '/api/auth/me',
  auth,
  async (req, res) => {
    return res.json({
      user: publicUser(req.user)
    });
  }
);

/* =========================
   PRODUCTS
========================= */

app.get(
  '/api/products/brands',
  async (_req, res) => {
    try {
      const brands =
        await Product.distinct(
          'brand'
        );

      res.json({
        brands: brands.sort()
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

app.get(
  '/api/products',
  async (req, res) => {
    try {
      const brand = String(
        req.query.brand || ''
      )
        .trim()
        .toLowerCase();

      const search = String(
        req.query.search || ''
      )
        .trim()
        .toLowerCase();

      let query = {};

      if (brand) {
        query.brand = new RegExp(
          `^${brand}$`,
          'i'
        );
      }

      if (search) {
        query.$or = [
          {
            name: {
              $regex: search,
              $options: 'i'
            }
          },
          {
            brand: {
              $regex: search,
              $options: 'i'
            }
          }
        ];
      }

      const products =
        await Product.find(query).sort({
          createdAt: -1
        });

      return res.json({
        products
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

app.get(
  '/api/products/:id',
  async (req, res) => {
    try {
      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          message:
            'Product not found.'
        });
      }

      return res.json({
        product
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

/* =========================
   CART
========================= */

app.get(
  '/api/cart',
  auth,
  async (req, res) => {
    try {
      const cart =
        await getCart(req.user._id);

      return res.json(
        await cartResponse(cart)
      );
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

app.post(
  '/api/cart/add',
  auth,
  async (req, res) => {
    try {
      const {
        productId,
        quantity
      } = req.body || {};

      const qty = Math.max(
        1,
        Number(quantity || 1)
      );

      const product =
        await Product.findById(
          productId
        );

      if (!product) {
        return res.status(404).json({
          message:
            'Product not found.'
        });
      }

      const cart =
        await getCart(req.user._id);

      const line =
        cart.items.find(
          (it) =>
            String(it.productId) ===
            String(productId)
        );

      if (line) {
        line.quantity += qty;
      } else {
        cart.items.push({
          productId,
          quantity: qty
        });
      }

      await cart.save();

      return res.json({
        message:
          'Added to cart.'
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

/* =========================
   ORDERS
========================= */

app.post(
  '/api/orders/checkout',
  auth,
  async (req, res) => {
    try {
      const {
        deliveryAddress,
        paymentMethod,
        items
      } = req.body || {};

      if (!deliveryAddress) {
        return res.status(400).json({
          message:
            'Delivery address required.'
        });
      }

      const cart =
        await getCart(req.user._id);

      const requestedItems =
        Array.isArray(items) &&
        items.length > 0
          ? items
          : cart.items;

      if (!requestedItems.length) {
        return res.status(400).json({
          message:
            'Cart is empty.'
        });
      }

      const orderItems =
        await hydrateOrderItems(
          requestedItems
        );

      const totalPrice =
        orderItems.reduce(
          (sum, it) =>
            sum +
            it.price * it.quantity,
          0
        );

      const order =
        await Order.create({
          userId: req.user._id,

          items: orderItems,

          totalPrice,

          paymentMethod:
            paymentMethod || 'COD',

          deliveryAddress,

          status: 'Placed'
        });

      cart.items = [];

      await cart.save();

      return res.json({
        message:
          'Order placed successfully.',

        order
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

/* =========================
   MY ORDERS
========================= */

app.get(
  '/api/orders/me',
  auth,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          userId: req.user._id
        }).sort({
          createdAt: -1
        });

      return res.json({
        orders
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

/* =========================
   ADMIN PRODUCTS
========================= */

app.post(
  '/api/admin/products',
  auth,
  adminOnly,
  upload.array('images', 5),
  async (req, res) => {
    try {
      const {
        name,
        brand,
        price
      } = req.body || {};

      const files = req.files || [];

      const imageUrls =
        files.map(
          (f) =>
            `/uploads/${f.filename}`
        );

      const product =
        await Product.create({
          name,

          brand,

          price: Number(price),

          imageUrl:
            imageUrls[0] || '',

          imageUrls
        });

      return res.json({
        message:
          'Product created.',

        product
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

/* =========================
   ADMIN ORDERS
========================= */

app.get(
  '/api/admin/orders',
  auth,
  adminOnly,
  async (_req, res) => {
    try {
      const orders =
        await Order.find().sort({
          createdAt: -1
        });

      return res.json({
        orders
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
);

/* =========================
   HEALTH
========================= */

app.get(
  '/api/health',
  (_req, res) => {
    res.json({
      ok: true,
      service:
        'piyush-watch-api'
    });
  }
);

/* =========================
   FRONTEND
========================= */

app.use((req, res, next) => {
  if (req.method !== 'GET')
    return next();

  if (req.path.startsWith('/api'))
    return next();

  const requested = path.join(
    ROOT_DIR,
    req.path
  );

  if (
    fs.existsSync(requested) &&
    fs.statSync(requested).isFile()
  ) {
    return res.sendFile(requested);
  }

  return res.sendFile(
    path.join(ROOT_DIR, 'index.html')
  );
});

/* =========================
   DEFAULT ADMIN
========================= */

async function createAdmin() {
  try {
    const existing =
      await User.findOne({
        email:
          'admin@piyushwatch.com'
      });

    if (!existing) {
      const passwordHash =
        await bcrypt.hash(
          'admin123',
          10
        );

      await User.create({
        name: 'Admin',

        mobileNumber:
          '9999999999',

        email:
          'admin@piyushwatch.com',

        passwordHash,

        role: 'admin',

        active: true,

        verified: true
      });

      console.log(
        'Default admin created'
      );
    }
  } catch (err) {
    console.log(
      'Admin create error:',
      err.message
    );
  }
}

/* =========================
   START SERVER
========================= */

mongoose.connection.once(
  'open',
  async () => {
    await createAdmin();

    app.listen(PORT, () => {
      console.log(
        `Piyush Watch server running on http://localhost:${PORT}`
      );

      console.log(
        'Default admin login: admin@piyushwatch.com / admin123'
      );
    });
  }
);