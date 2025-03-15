import { protect } from './authMiddleware.js';

// Re-export the protect function as auth for backward compatibility
export { protect as auth };