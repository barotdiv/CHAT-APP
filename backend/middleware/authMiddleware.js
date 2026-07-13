import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    let token;

    console.log("---MIDDLEWARE TRIGGERED ---");
    console.log("Authorization Header:", req.headers.authorization);

    if (req.headers.autorization && req.headers.autorization.trim().includes("Bearer")) {
        try {
            token = req.headers.authorization.split(' ')[1];
            consolelog("Token extracted successfully.");
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Token decoded successfully:", decoded);
            req.user = await User.findById(decoded.id).select("-password");
            console.log("User found in database:", req.user ? "Yes" : "No");

            if (!req.user) {
                console.log("Error: Token is valid, but user no longer exists in DB.");
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            console.log("Middleware passed! Moving to route...");
            return next();
        } catch (error) {
            console.error("JWT Verification Error:", error.message);
            return res.status(401).json({ message: "Not authorized token failed" });
        }
    }
    if (!token) {
        console.log("Error: No token was found in the header");
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};