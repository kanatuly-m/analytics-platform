const express = require("express");
const router = express.Router();
const Measurement = require("../models/Measurement");

const ALLOWED_FIELDS = new Set(["field1", "field2", "field3"]);

function validateField(field) {
  if (!field) return "Missing required param: field (field1/field2/field3).";
  if (!ALLOWED_FIELDS.has(field))
    return `Invalid field name: ${field}. Allowed: field1, field2, field3.`;
  return null;
}

function parseDateRange(startStr, endStr) {
  let start = null;
  let end = null;

  if (startStr) {
    start = new Date(startStr);
    if (Number.isNaN(start.getTime()))
      return { error: "Invalid start_date format. Use YYYY-MM-DD." };
    start.setUTCHours(0, 0, 0, 0);
  }

  if (endStr) {
    end = new Date(endStr);
    if (Number.isNaN(end.getTime()))
      return { error: "Invalid end_date format. Use YYYY-MM-DD." };
    end.setUTCHours(23, 59, 59, 999);
  }

  if (start && end && start > end)
    return { error: "start_date cannot be after end_date." };

  return { start, end };
}

router.get("/", async (req, res, next) => {
  try {
    const { field, start_date, end_date } = req.query;

    const fieldErr = validateField(field);
    if (fieldErr) return res.status(400).json({ error: fieldErr });

    const { start, end, error } = parseDateRange(start_date, end_date);
    if (error) return res.status(400).json({ error });

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "200", 10), 1), 2000);
    const skip = (page - 1) * limit;

    const query = { [field]: { $ne: null } };

    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = start;
      if (end) query.timestamp.$lte = end;
    }

    const data = await Measurement.find(query, { _id: 0, timestamp: 1, [field]: 1 })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit);

    if (!data.length)
      return res.status(404).json({ error: "No data found for given parameters." });

    res.json({
      meta: { field, start_date: start_date || null, end_date: end_date || null, page, limit, returned: data.length },
      data,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/metrics", async (req, res, next) => {
  try {
    const { field, start_date, end_date } = req.query;

    const fieldErr = validateField(field);
    if (fieldErr) return res.status(400).json({ error: fieldErr });

    const { start, end, error } = parseDateRange(start_date, end_date);
    if (error) return res.status(400).json({ error });

    const match = { [field]: { $ne: null } };
    if (start || end) {
      match.timestamp = {};
      if (start) match.timestamp.$gte = start;
      if (end) match.timestamp.$lte = end;
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: null,
          avg: { $avg: `$${field}` },
          min: { $min: `$${field}` },
          max: { $max: `$${field}` },
          stdDev: { $stdDevPop: `$${field}` },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, avg: 1, min: 1, max: 1, stdDev: 1, count: 1 } },
    ];

    const result = await Measurement.aggregate(pipeline);

    if (!result.length || result[0].count === 0)
      return res.status(404).json({ error: "No data found to compute metrics." });

    res.json({
      field,
      range: { start_date: start_date || null, end_date: end_date || null },
      metrics: result[0],
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

