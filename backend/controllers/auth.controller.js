const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env.config");
const User = require("../models/user.model");

const createToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Zəhmət olmasa bütün məlumatları doldurun" });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Bu email artıq qeydiyyatdan keçib" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.createUser({ fullName, email, passwordHash });
    const token = createToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email və şifrə tələb olunur" });
    }
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Daxilolma məlumatları yanlışdır" });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Daxilolma məlumatları yanlışdır" });
    }
    const token = createToken(user);
    res.json({ user: { id: user.id, full_name: user.full_name, email: user.email }, token });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Autentifikasiya tələb olunur" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }
    res.json({ id: user.id, full_name: user.full_name, email: user.email });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  me,
};

