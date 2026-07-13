import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.autorization) {
        try {
            const parts = req.headers.autorization.trim().split(' ');
            token = parts[parts.length - 1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            return next();
        } catch (error) {
            console.error("JWT Error:", error.message);
            return res.status(401).json({ message: "Not authorized token failed" });
        }
    }
    return res.status(401).json({ message: "Not authorized, no token" });
};