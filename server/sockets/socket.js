// This file re-exports the io instance from server.js

// Import the io instance from server
import { io } from '../server.js';

// In server.js
const io = new Server(server, {
  // configuration...
});

// Later in the file
export { app, server, io };

// Export it for use by other modules
export { io };