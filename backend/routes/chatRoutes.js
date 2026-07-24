import express from 'express';
import multer from "multer";
import { protect } from '../middleware/authMiddleware.js';
import {
    getChats,
    createChat,
    updateChat,
    deleteChat,
    duplicateChat,
    getMessages,
    addMessage,
    deleteMessage
} from '../controllers/chatController.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(protect);

router.route('/').get(getChats).post(createChat);
router.route('/:id').put(updateChat).delete(deleteChat);
router.route('/:id/duplicate').post(duplicateChat);

router.route('/:id/messages').get(getMessages).post(upload.single('image'), addMessage);
router.route('/:id/messages/:messageId').delete(deleteMessage);

export default router;