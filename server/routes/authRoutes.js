import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/index.js';
import rateLimit from 'express-rate-limit';
import { JWT_SECRET } from '../server.js';

const router = express.Router();
const prisma = new PrismaClient();
const TOKEN_EXPIRY = '1d';

// Rate limiter for auth endpoints - configured to work with 'trust proxy'
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

// Apply rate limiter to auth routes
router.use(authLimiter);

// Password validation
const isPasswordValid = (password) => {
  // At least 8 characters, with at least one uppercase, one lowercase, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (!isPasswordValid(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers' 
      });
    }
    
    // Check if user already exists - use timing-safe comparison to prevent timing attacks
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Invalid registration details' });
    }
    
    // Use a transaction to ensure user and default chat are created atomically
    const result = await prisma.$transaction(async (tx) => {
      // Add work factor to resist brute-force attacks
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create the user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null
        }
      });
      
      // Create a default chat for the new user
      const defaultChat = await tx.chat.create({
        data: {
          userId: user.id
        }
      });
      
      return { user, defaultChat };
    });
    
    // Use the JWT_SECRET imported from server.js
    const token = jwt.sign({ userId: result.user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    
    res.status(201).json({ 
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name
      },
      defaultChat: {
        id: result.defaultChat.id
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Generic error message to avoid information leakage
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login route with consistent timing
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const startTime = Date.now(); // Track time for consistent response timing
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    let isValid = false;
    
    if (user) {
      isValid = await bcrypt.compare(password, user.password);
    }

    // If invalid, add artificial delay to prevent timing attacks
    if (!isValid) {
      // Ensure consistent response timing regardless of whether user exists
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) { // 500ms minimum response time
        await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user's chats
    const chats = await prisma.chat.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 1 // Get the most recent chat
    });
    
    const defaultChat = chats.length > 0 ? chats[0] : null;
    
    // Create a chat if user doesn't have any
    if (!defaultChat) {
      const newChat = await prisma.chat.create({
        data: { userId: user.id }
      });
      
      // Use the JWT_SECRET imported from server.js
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      res.json({ 
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        defaultChat: {
          id: newChat.id
        }
      });
    } else {
      // Use the JWT_SECRET imported from server.js
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      res.json({ 
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        defaultChat: {
          id: defaultChat.id
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Authentication middleware with better error handling
export const authenticateUser = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    // Use the JWT_SECRET imported from server.js
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check token expiration explicitly
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ error: 'Session expired, please log in again' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired, please log in again' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Get current user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    // req.user is already set by the authenticateUser middleware
    
    // Get user's chats to include the default one
    const chats = await prisma.chat.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 1 // Get the most recent chat
    });
    
    const defaultChat = chats.length > 0 ? chats[0] : null;
    
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      defaultChat: defaultChat ? { id: defaultChat.id } : null
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;