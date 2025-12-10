// src/controllers/accessLogController.js
const { AccessLogs } = require("../models");

// Digunakan di auth controller
exports.createLog = async ({ user_id, action, req }) => {
  try {
    await AccessLogs.create({
      user_id,
      action,
      ip_address: req?.ip || req?.headers['x-forwarded-for'] || 'unknown',
      user_agent: req?.headers['user-agent'] || 'unknown'
    });
    console.log(`AccessLog: ${action} user_id=${user_id}`);
  } catch (err) {
    console.error("AccessLog Error:", err.message);
  }
};

// Digunakan untuk route GET /access-logs (admin)
exports.getLogs = async (req, res) => {
  try {
    const logs = await AccessLogs.findAll({
      include: ["user"],
      order: [["createdAt", "DESC"]]
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
