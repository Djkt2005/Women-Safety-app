const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const smsService = require("./services/smsService");
const callService = require("./services/callService");

const app = express();

// Security middleware
app.use(express.json({ limit: "10kb" })); // Body limit
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Validate phone number format
const validatePhoneNumber = (number) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(number.replace(/\D/g, ""));
};

app.post("/api/send-sms", async (req, res) => {
  try {
    const { to, message } = req.body;

    // Input validation
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: "Phone number and message are required",
      });
    }

    if (!validatePhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format",
      });
    }

    const result = await smsService.sendSMS(to, message);
    res.json(result);
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send SMS",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.post("/api/initiate-call", async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const result = await callService.initiateCall(to);
    res.json(result);
  } catch (error) {
    console.error("Error initiating call:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate call",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
