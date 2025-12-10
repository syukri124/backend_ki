const { Users, Roles, UserRoles, LoginAttempts, SystemLock } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const accessLogController = require("./accessLogController");
// src/controllers/authController.js


exports.registerAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username dan password wajib diisi." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password minimal 6 karakter." });
    }

    // Cek apakah sudah ada user dengan username ini
    const exists = await Users.findOne({ where: { username } });
    if (exists) {
      return res.status(409).json({ success: false, message: "Username sudah digunakan." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await Users.create({
      username,
      password: hashedPassword,
    });

    // Cari role ADMIN di tabel Roles (misal role id = 1)
    let adminRole = await Roles.findOne({ where: { name: "ADMIN" } });
    if (!adminRole) {
      // Jika belum ada, buat role ADMIN
      adminRole = await Roles.create({ name: "ADMIN", description: "Full access" });
    }

    // Assign role ADMIN ke user
    await UserRoles.create({ user_id: newUser.id, role_id: adminRole.id });

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, roles: [adminRole.id] },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Admin berhasil dibuat",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        roles: [adminRole.id],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Users.findOne({ where: { username } });
    if (!user) {
      await accessLogController.createLog({ user_id: null, action: `Login gagal - user tidak ditemukan (${username})`, req });
      return res.status(400).json({ success: false, message: "User tidak ditemukan" });
    }

    // Cek lock
    const lock = await SystemLock.findOne({ where: { user_id: user.id, is_locked: true } });
    if (lock && new Date(lock.locked_until) > new Date()) {
      await accessLogController.createLog({ user_id: user.id, action: "Login ditolak - user terkunci", req });
      return res.status(403).json({ success: false, message: `User terkunci hingga ${lock.locked_until}` });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Tambahkan percobaan login
      const attempt = await LoginAttempts.findOne({ where: { user_id: user.id } });
      if (!attempt) {
        await LoginAttempts.create({ user_id: user.id, attempts: 1 });
      } else {
        attempt.attempts += 1;
        attempt.last_attempt = new Date();
        await attempt.save();

        // Lock jika gagal >=5
        if (attempt.attempts >= 5) {
          await SystemLock.create({
            user_id: user.id,
            is_locked: true,
            locked_until: new Date(Date.now() + 30 * 60 * 1000)
          });
          attempt.attempts = 0;
          await attempt.save();
        }
      }

      await accessLogController.createLog({ user_id: user.id, action: "Login gagal - password salah", req });
      return res.status(400).json({ success: false, message: "Password salah" });
    }

    // Login sukses -> reset attempts
    await LoginAttempts.destroy({ where: { user_id: user.id } });

    const roles = await UserRoles.findAll({ where: { user_id: user.id } });
    const roleIds = roles.map(r => r.role_id);

    const token = jwt.sign({ id: user.id, username: user.username, roles: roleIds }, process.env.JWT_SECRET, { expiresIn: "1d" });

    await accessLogController.createLog({ user_id: user.id, action: "Login berhasil", req });

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: { id: user.id, username: user.username, roles: roleIds }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};