const { Users, Roles, UserRoles } = require("../models/index");
const bcrypt = require("bcrypt");

// --- CREATE USER & ASSIGN ROLES ---
exports.createUser = async (req, res) => {
  try {
    const { username, password, roles } = req.body;

    // Validasi manual
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter.",
      });
    }

    // Cek username sudah dipakai
    const exists = await Users.findOne({ where: { username } });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Username sudah digunakan.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user
    const newUser = await Users.create({
      username,
      password: hashedPassword,
    });

    // Assign roles (opsional)
    if (Array.isArray(roles) && roles.length > 0) {
      for (let r of roles) {
        await UserRoles.create({
          user_id: newUser.id,
          role_id: r,
        });
      }
    }

    res.json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUser.id,
        username: newUser.username,
        roles: roles || [],
      },
    });
  } catch (error) {
    console.error("CreateUser Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// --- GET ALL USERS + ROLES ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      include: [
        {
          model: Roles,
          as: "roles",
          through: { attributes: [] }, // hide junction table
        },
      ],
    });

    res.json({ success: true, data: users });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};
