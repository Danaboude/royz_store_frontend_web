const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Import routes
const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const categoriesRouter = require("./routes/categories");
const cartsRouter = require("./routes/carts");
const ordersRouter = require("./routes/orders");
const usersRouter = require("./routes/users");
const couponsRouter = require("./routes/coupons");
const deliveryAddressesRouter = require("./routes/deliveryAddresses");
const reviewsRouter = require("./routes/reviews");
const paymentsRouter = require("./routes/payments");
const notificationsRouter = require("./routes/notifications");
const staticPagesRouter = require("./routes/staticPages");
const productMediaRouter = require("./routes/productMedia");
const rolesRouter = require("./routes/roles");
const statisticsRouter = require('./routes/statistics');
const bannersRouter = require('./routes/banners');
const favoritesRouter = require('./routes/favorites');
const deliveryRouter = require('./routes/delivery');
const subscriptionsRouter = require('./routes/subscriptions');
const homeRouter = require('./routes/home');
const databaseProceduresRouter = require('./routes/databaseProcedures');
const vendorPaymentsRouter = require('./routes/vendorPayments');
const vendorProductsRouter = require('./routes/vendorProducts');
const vendorOnlyProductsRouter = require('./routes/vendorOnlyProducts');

// Import enhanced database
const { pool, cache } = require('./db/db');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting (Disabled or relaxed for Serverless to avoid issues with cold starts/IP sharing)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000, 
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Enable CORS
app.use(cors({
  origin: true, // Allow all origins in serverless for easier setup
  credentials: true
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (Note: Vercel serverless has a read-only filesystem, uploads should eventually move to S3/Cloudinary)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            serverless: true
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// API versioning middleware
app.use('/api/v1', (req, res, next) => {
    req.apiVersion = 'v1';
    next();
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/delivery-addresses', deliveryAddressesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/static-pages', staticPagesRouter);
app.use('/api/product-media', productMediaRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/home', homeRouter);
app.use('/api/db-procedures', databaseProceduresRouter);

// Vendor routes
app.use('/api/vendor/vendor-products', vendorOnlyProductsRouter);
app.use('/api/vendor', vendorPaymentsRouter);
app.use('/api/vendor/products', vendorProductsRouter);
app.use('/api/vendor/analytics', require('./routes/vendorAnalytics'));
app.use('/api/vendor/dashboard', require('./routes/vendorDashboard'));
app.use('/api/vendor/notifications', notificationsRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.originalUrl
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

module.exports = app;
