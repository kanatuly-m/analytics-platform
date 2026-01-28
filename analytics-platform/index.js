require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const measurementsRouter = require("./routes/measurements");

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/measurements", measurementsRouter);

app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://kanatuly:14012007@cluster0.etiq9qr.mongodb.net/?appName=Cluster0";

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
