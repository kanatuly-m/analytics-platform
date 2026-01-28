const mongoose = require("mongoose");
const Measurement = require("./models/Measurement");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/analytics";

function rand(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

(async () => {
  await mongoose.connect(MONGODB_URI);

  await Measurement.deleteMany({});

  const now = new Date();
  const docs = [];

  // каждые 30 минут за 7 дней
  const points = 7 * 24 * 2;

  for (let i = points; i >= 0; i--) {
    const t = new Date(now);
    t.setMinutes(t.getMinutes() - i * 30);

    docs.push({
      timestamp: t,
      field1: rand(18, 28),
      field2: rand(30, 80),
      field3: rand(350, 900),
    });
  }

  await Measurement.insertMany(docs);
  console.log(`✅ Seed done: inserted ${docs.length} docs`);

  await mongoose.disconnect();
})();
