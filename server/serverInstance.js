// Server instance data - shared across the application
// This file stores server-level state that needs to be accessed by multiple modules

const serverStartTime = Date.now();

module.exports = {
  serverStartTime,
};
