import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getChats,
    createChat,
    updateChat,
    deleteChat,
    getMessages,
    addMessage
} from '../controllers/chatController.js';

const router = express.Router();
router.use(protect);

router.route('/').get(getChats).post(createChat);
router.route('/:id').put(updateChat).delete(deleteChat);

router.route('/:id/messages').get(getMessages).post(addMessage);

export default router;