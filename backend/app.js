const express = require("express");
const cors = require("cors");
const config = require("./config/env.config");
const { httpLogger } = require("./utils/logger");
const errorMiddleware = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const blogRoutes = require("./routes/blog.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(httpLogger);

app.get("/health", (req, res) => {
  res.json({ status: "ok", env: config.nodeEnv });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

app.use(errorMiddleware);

module.exports = app;

