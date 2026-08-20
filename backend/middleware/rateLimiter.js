// Sliding-window Rate Limiter Middleware for AI requests
const requestMap = new Map();

/**
 * Creates a rate limiting middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 1 minute)
 * @param {number} options.maxRequests - Max requests allowed per window (default: 20)
 */
export const aiRateLimiter = ({ windowMs = 60 * 1000, maxRequests = 20 } = {}) => {
  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();

    if (!requestMap.has(key)) {
      requestMap.set(key, []);
    }

    const timestamps = requestMap.get(key);

    // Filter out timestamps older than the windowMs
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);

    if (validTimestamps.length >= maxRequests) {
      const oldestTimestamp = validTimestamps[0];
      const resetInSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      res.setHeader('Retry-After', resetInSeconds);
      return res.status(429).json({
        message: `Too many AI requests. Please wait ${resetInSeconds} seconds before sending another message.`,
        retryAfter: resetInSeconds
      });
    }

    validTimestamps.push(now);
    requestMap.set(key, validTimestamps);

    // Periodic cleanup of unused keys to prevent memory leak
    if (requestMap.size > 1000) {
      for (const [k, ts] of requestMap.entries()) {
        if (ts.every(t => now - t >= windowMs)) {
          requestMap.delete(k);
        }
      }
    }

    next();
  };
};
