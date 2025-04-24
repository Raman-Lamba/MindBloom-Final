import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { PrismaClient } from './generated/prisma/index.js';
import { Agent } from './pc.js'; // Import your existing Agent class
import authRoutes, { authenticateUser } from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Prisma client
const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
        methods: ["GET", "POST"],
    },
});

app.use(express.json());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, '../client/build')));
}

app.use('/auth', authRoutes);
app.use('/api', chatRoutes);

// Add JWT secret from environment or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Initialize the agent with Pinecone and model setup
async function initializeAgent() {
    try {
        const { OpenAI } = await import("openai");
        
        // Initialize your LLM configuration
        const llm = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
        });

        // Create agent instance
        return new Agent(llm);
    } catch (error) {
        console.error('Error initializing agent:', error);
        throw error;
    }
}

let agentPromise = initializeAgent();

// WebSocket handler
io.on("connection", async (socket) => {
    console.log("New client connected:", socket.id);

    const agent = await agentPromise;
    let userId = null;

    // Authenticate user via token
    socket.on('authenticate', async (data) => {
        try {
            const { token } = data;
            if (!token) {
                socket.emit('auth_error', { message: 'Authentication required' });
                return;
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await prisma.user.findUnique({ 
                where: { id: decoded.userId }
            });
            
            if (!user) {
                socket.emit('auth_error', { message: 'User not found' });
                return;
            }
            
            userId = user.id;
            socket.emit('authenticated', { userId });
        } catch (error) {
            console.error('Socket authentication error:', error);
            socket.emit('auth_error', { message: 'Invalid authentication' });
        }
    });

    socket.on('message', async (data) => {
        try {
            // Require authentication
            if (!userId) {
                socket.emit('auth_error', { message: 'Authentication required' });
                return;
            }

            const { message, chatId } = data;
            
            // Verify chat belongs to user
            if (chatId) {
                const chat = await prisma.chat.findUnique({
                    where: { id: chatId }
                });
                
                if (!chat || chat.userId !== userId) {
                    socket.emit('error', { message: 'Chat not found or access denied' });
                    return;
                }
            }
            
            // Create chat if not provided
            let currentChatId = chatId;
            if (!currentChatId) {
                const newChat = await prisma.chat.create({
                    data: { userId }
                });
                currentChatId = newChat.id;
            }
            
            // Save user message
            await prisma.message.create({
                data: {
                    chatId: currentChatId,
                    content: message,
                    role: 'user'
                }
            });
            
            // Get AI response
            const response = await agent.answerQuestion(message);
            
            // Count messages
            const messageCount = await prisma.message.count({ 
                where: { chatId: currentChatId } 
            });
            
            // Remove oldest message if at limit
            if (messageCount >= 9) { // 9 to make room for new message
                const oldestMessage = await prisma.message.findFirst({
                    where: { chatId: currentChatId },
                    orderBy: { createdAt: 'asc' }
                });
                
                if (oldestMessage) {
                    await prisma.message.delete({ 
                        where: { id: oldestMessage.id } 
                    });
                }
            }
            
            // Save AI response
            const assistantMessage = await prisma.message.create({
                data: {
                    chatId: currentChatId,
                    content: response,
                    role: 'assistant'
                }
            });
            
            // Update chat timestamp
            await prisma.chat.update({
                where: { id: currentChatId },
                data: { updatedAt: new Date() }
            });
            
            socket.emit('response', { 
                message: response, 
                chatId: currentChatId,
                messageId: assistantMessage.id
            });
        } catch (error) {
            console.error("Error processing message:", error);
            socket.emit('error', { message: "An error occurred while processing your request." });
        }
    });

    socket.on('disconnect', () => {
        console.log("Client disconnected:", socket.id);
    });
});

// REST API handler - enforce authentication 
app.post('/api/query', authenticateUser, async (req, res) => {
    try {
        const { query, chatId } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        // Verify chat belongs to user or create new chat
        let currentChatId = chatId;
        if (chatId) {
            const chat = await prisma.chat.findUnique({
                where: { id: chatId }
            });
            
            if (!chat || chat.userId !== req.user.id) {
                return res.status(403).json({ error: "Chat not found or access denied" });
            }
        } else {
            // Create new chat
            const newChat = await prisma.chat.create({
                data: { userId: req.user.id }
            });
            currentChatId = newChat.id;
        }

        // Save user message
        await prisma.message.create({
            data: {
                chatId: currentChatId,
                content: query,
                role: 'user'
            }
        });

        // Get AI response
        const agent = await agentPromise;
        const answer = await agent.answerQuestion(query);

        // Check message limit
        const messageCount = await prisma.message.count({ 
            where: { chatId: currentChatId } 
        });
        
        if (messageCount >= 9) {
            const oldestMessage = await prisma.message.findFirst({
                where: { chatId: currentChatId },
                orderBy: { createdAt: 'asc' }
            });
            
            if (oldestMessage) {
                await prisma.message.delete({ 
                    where: { id: oldestMessage.id } 
                });
            }
        }

        // Save assistant response
        const assistantMessage = await prisma.message.create({
            data: {
                chatId: currentChatId,
                content: answer,
                role: 'assistant'
            }
        });

        // Update chat timestamp
        await prisma.chat.update({
            where: { id: currentChatId },
            data: { updatedAt: new Date() }
        });

        res.json({ 
            answer, 
            chatId: currentChatId,
            messageId: assistantMessage.id 
        });
    } catch (error) {
        console.error("Error processing query:", error);
        res.status(500).json({ error: "An error occurred while processing your request" });
    }
});

// Catch-all handler
app.get('*', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
    } else {
        res.status(404).send('API endpoint not found. In development, frontend is served separately.');
    }
});

const PORT = process.env.PORT || 5001;

// Function to start server after connecting to database
async function startServer() {
    try {
        // Connect to the database
        await prisma.$connect();
        console.log('Connected to database');
        
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing database connection and shutting down server...');
    await prisma.$disconnect();
    process.exit(0);
});

startServer();