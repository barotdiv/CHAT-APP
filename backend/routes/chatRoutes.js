import express from 'express';
import multer from "multer";
import { protect } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import {
    getChats,
    createChat,
    updateChat,
    deleteChat,
    duplicateChat,
    getMessages,
    addMessage,
    streamMessage,
    regenerateMessage,
    editUserMessage,
    continueMessage,
    searchChats,
    deleteMessage
} from '../controllers/chatController.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(protect);

router.route('/search').get(searchChats);

router.route('/').get(getChats).post(createChat);
router.route('/:id').put(updateChat).delete(deleteChat);
router.route('/:id/duplicate').post(duplicateChat);

router.route('/:id/messages').get(getMessages).post(upload.single('image'), addMessage);
router.route('/:id/messages/stream').post(aiRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 }), upload.single('image'), streamMessage);

router.route('/:id/messages/:messageId/regenerate').post(aiRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 }), regenerateMessage);
router.route('/:id/messages/:messageId/edit').post(aiRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 }), editUserMessage);
router.route('/:id/messages/:messageId/continue').post(aiRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 }), continueMessage);

router.route('/:id/messages/:messageId').delete(deleteMessage);

export default router;