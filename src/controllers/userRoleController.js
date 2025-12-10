const db = require("../models");
const UserRoles = db.UserRoles;

// CREATE: Menambah satu role (Single Assign)
exports.create = async (req, res) => {
    try {
        const { user_id, role_id } = req.body;

        const existing = await UserRoles.findOne({ where: { user_id, role_id } });
        if (existing) {
            return res.status(400).json({ message: "User already has this role" });
        }

        const data = await UserRoles.create({ user_id, role_id });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET: Melihat semua data role user
exports.get = async (req, res) => {
    try {
        const data = await UserRoles.findAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE: Melakukan Sync (Cocok untuk fitur Checkbox)
// Logic: Hapus semua role lama user, ganti dengan list baru
exports.update = async (req, res) => {
    try {
        const { user_id, role_ids } = req.body; // role_ids harus array [1, 2, 3]

        if (!Array.isArray(role_ids)) {
            return res.status(400).json({ message: "role_ids must be an array" });
        }

        // Hapus role lama
        await UserRoles.destroy({ where: { user_id: user_id } });

        // Masukkan role baru (jika ada)
        if (role_ids.length > 0) {
            const bulkData = role_ids.map(rid => ({
                user_id: user_id,
                role_id: rid
            }));
            await UserRoles.bulkCreate(bulkData);
        }

        res.json({ success: true, message: "User roles updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE: Menghapus satu role spesifik
exports.delete = async (req, res) => {
    try {
        const { user_id, role_id } = req.body; 

        // Fallback jika pakai params ID
        if (!user_id && req.params.id) {
             await UserRoles.destroy({ where: { id: req.params.id } });
             return res.json({ success: true, message: "Role removed by ID" });
        }

        const deleted = await UserRoles.destroy({
            where: { user_id, role_id }
        });

        if (deleted) {
            res.json({ success: true, message: "Role removed from user" });
        } else {
            res.status(404).json({ message: "Role not found for this user" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};