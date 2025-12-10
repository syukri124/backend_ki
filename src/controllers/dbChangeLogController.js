const { DBChangeLogs } = require("../models");

exports.logChange = async ({ table_name, action, record_id, user_id, description }) => {
  try {
    if (!table_name || !action) {
      console.error("DBChangeLog Error: table_name dan action wajib diisi");
      return;
    }

    await DBChangeLogs.create({
      table_name,
      action,
      record_id: record_id || null,
      user_id: user_id || null,
      description: description || null
    });

    console.log(`DBChangeLog: ${action} pada ${table_name}, record_id=${record_id}`);
  } catch (err) {
    console.error("DBChangeLog Error:", err.message);
  }
};

// GET DBChangeLogs, optional filter by table name
exports.getLogs = async (req, res) => {
  try {
    const { table } = req.query; // ambil query parameter ?table=Products
    const whereClause = table ? { table_name: table } : {};

    const logs = await DBChangeLogs.findAll({
      where: whereClause,
      include: ["user"], // kalau mau join user
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};