const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const measurementsRouter = require("./routes/measurements");

const app = express();
app.use(express.json());

// Frontend (static)
app.use(express.static(path.join(__dirname, "public")));

// API
app.use("/api/measurements", measurementsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/analytics";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running: http://localhost:${PORT}`)
    );
  })
  .catch((e) => {
    console.error("❌ MongoDB connection error:", e.message);
    process.exit(1);
  });
