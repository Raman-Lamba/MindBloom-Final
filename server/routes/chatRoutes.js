import express from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authenticateUser } from './authRoutes.js';
import { MESSAGE_LIMIT } from '../server.js';

const router = express.Router();
const prisma = new PrismaClient();

// Protected routes
router.use(authenticateUser);

// Get user's chats
router.get('/chats', async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.user.id },
      include: { 
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create chat with message limit
router.post('/chats', async (req, res) => {
  try {
    const chat = await prisma.chat.create({
      data: {
        userId: req.user.id,
      },
      include: { messages: true }
    });
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Chat creation failed' });
  }
});

// Add message with role enforcement
router.post('/chats/:chatId/messages', async (req, res) => {
  const { content, role } = req.body;
  const { chatId } = req.params;

  try {
    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify chat belongs to user
    const chat = await prisma.chat.findUnique({
      where: { id: chatId }
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    if (chat.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    // Use a transaction to ensure atomicity of operations
    const result = await prisma.$transaction(async (tx) => {
      // Check message count
      const messageCount = await tx.message.count({ where: { chatId } });
      
      if (messageCount >= MESSAGE_LIMIT - 1) {
        // Delete oldest message
        const oldestMessage = await tx.message.findFirst({
          where: { chatId },
          orderBy: { createdAt: 'asc' }
        });
        
        if (oldestMessage) {
          await tx.message.delete({ where: { id: oldestMessage.id } });
        }
      }

      // Create new message
      const message = await tx.message.create({
        data: {
          content,
          role,
          chatId
        }
      });

      // Update chat's updatedAt
      await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
      });

      return message;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Message creation failed' });
  }
});

// Get a specific chat
router.get('/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await prisma.chat.findFirst({
      where: { 
        id: chatId,
        userId: req.user.id  // Ensure chat belongs to user
      },
      include: { 
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

export default router;