let ioInstance;

function initializeSocket(server) {
  const { Server } = require("socket.io");

  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    socket.on("join:user", (userId) => {
      if (!userId) return;
      socket.join(`support:user:${userId}`);
    });

    socket.on("join:admin", () => {
      socket.join("support:admins");
    });
  });

  return ioInstance;
}

function getSocket() {
  return ioInstance;
}

module.exports = {
  initializeSocket,
  getSocket,
};