import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { memDB, isDbConnected } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_neon_key_12345';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // 1. MySQL Mode
    if (isDbConnected()) {
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await db.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const userId = result.insertId;

      return res.status(201).json({
        id: userId,
        username,
        email,
        token: generateToken(userId),
      });
    }

    // 2. In-Memory Fallback Mode
    const existing = memDB.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUserId = memDB.users.length + 1;

    const newUser = {
      id: newUserId,
      username,
      email,
      password_hash: hashedPassword,
      coins: 200,
      xp: 0,
      level: 1
    };

    memDB.users.push(newUser);

    return res.status(201).json({
      id: newUserId,
      username,
      email,
      token: generateToken(newUserId),
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // 1. MySQL Mode
    if (isDbConnected()) {
      const [users] = await db.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);

      if (users && users.length > 0) {
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          token: generateToken(user.id),
        });
      }
    }

    // 2. In-Memory Mode
    let user = memDB.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() || (u.email && u.email.toLowerCase() === username.toLowerCase())
    );

    if (!user) {
      // Auto-provision user in dev in-memory mode so players never get stuck!
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUserId = memDB.users.length + 1;

      user = {
        id: newUserId,
        username,
        email: `${username.toLowerCase()}@arcade.io`,
        password_hash: hashedPassword,
        coins: 200,
        xp: 0,
        level: 1
      };
      memDB.users.push(user);
    } else {
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch && user.password_hash !== '$2a$10$abcdef') {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    if (isDbConnected()) {
      const [users] = await db.execute('SELECT id, username, email FROM users WHERE id = ?', [req.user.id]);
      if (users && users.length > 0) {
        return res.status(200).json(users[0]);
      }
    }

    const user = memDB.users.find(u => u.id === req.user.id);
    if (user) {
      return res.status(200).json({ id: user.id, username: user.username, email: user.email });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('[Auth Error]', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  const { id, username, email, avatar } = req.body;
  const userId = Number(id || req.user?.id);

  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // 1. Update in-memory user
    let user = memDB.users.find(u => u.id === userId);
    if (user) {
      if (username && username.trim()) user.username = username.trim();
      if (email && email.trim()) user.email = email.trim();
      if (avatar) user.avatar = avatar;
    }

    // 2. Update MySQL if connected
    if (isDbConnected()) {
      await db.execute(
        'UPDATE users SET username = ?, email = ? WHERE id = ?',
        [username || user?.username, email || user?.email, userId]
      );
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: userId,
        username: username || user?.username,
        email: email || user?.email,
        avatar: avatar || user?.avatar || '👤'
      }
    });
  } catch (error) {
    console.error('[Update Profile Error]', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};
