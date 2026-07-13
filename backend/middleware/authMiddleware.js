import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    console.log("HEADERS RECEIVED BY SERVER:", req.headers);

    if (req.headers.authorization) {
        try {
            const parts = req.headers.authorization.trim().split(' ');
            const token = parts[parts.length - 1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            return next();
        } catch (error) {
            console.error("JWT Error:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token' });
};