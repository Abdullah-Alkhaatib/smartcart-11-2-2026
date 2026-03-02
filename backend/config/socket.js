let ioInstance;
const onlineUserSocketIdsByUserId = new Map();
const userLastSeenAtByUserId = new Map();
const { User } = require("../model/UserModel.js");
const { Support } = require("../model/SupportModel.js");

function getUserSupportStatus(userId) {
  const normalizedUserId = String(userId || "");
  if (!normalizedUserId) {
    return {
      userId: normalizedUserId,
      isOnline: false,
      lastSeenAt: null,
    };
  }

  const activeSockets = onlineUserSocketIdsByUserId.get(normalizedUserId);
  const isOnline = Boolean(activeSockets && activeSockets.size > 0);

  return {
    userId: normalizedUserId,
    isOnline,
    lastSeenAt: isOnline ? null : userLastSeenAtByUserId.get(normalizedUserId) || null,
  };
}

async function getPersistedLastSeenAt(userId) {
  const normalizedUserId = String(userId || "");
  if (!normalizedUserId) return null;

  const cachedLastSeenAt = userLastSeenAtByUserId.get(normalizedUserId);
  if (cachedLastSeenAt) {
    return cachedLastSeenAt;
  }

  const userDocument = await User.findById(normalizedUserId)
    .select("supportLastSeenAt")
    .lean();

  if (userDocument?.supportLastSeenAt) {
    return userDocument.supportLastSeenAt;
  }

  const lastSupportMessage = await Support.findOne({ userId: normalizedUserId })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean();

  return lastSupportMessage?.createdAt || null;
}

async function resolveUserSupportStatus(userId) {
  const immediateStatus = getUserSupportStatus(userId);
  if (immediateStatus.isOnline || immediateStatus.lastSeenAt) {
    return immediateStatus;
  }

  const persistedLastSeenAt = await getPersistedLastSeenAt(userId);

  return {
    ...immediateStatus,
    lastSeenAt: persistedLastSeenAt,
  };
}

function broadcastUserSupportStatus(userId) {
  if (!ioInstance || !userId) return;

  resolveUserSupportStatus(userId)
    .then((statusPayload) => {
      ioInstance.to("support:admins").emit("support:user-status", statusPayload);
    })
    .catch(() => {
      ioInstance.to("support:admins").emit("support:user-status", getUserSupportStatus(userId));
    });
}

function setUserOnline(userId, socketId) {
  const normalizedUserId = String(userId || "");
  if (!normalizedUserId || !socketId) return;

  if (!onlineUserSocketIdsByUserId.has(normalizedUserId)) {
    onlineUserSocketIdsByUserId.set(normalizedUserId, new Set());
  }

  onlineUserSocketIdsByUserId.get(normalizedUserId).add(socketId);
}

function setUserOfflineIfNeeded(userId, socketId) {
  const normalizedUserId = String(userId || "");
  if (!normalizedUserId || !socketId) return;

  const activeSockets = onlineUserSocketIdsByUserId.get(normalizedUserId);
  if (!activeSockets) return;

  activeSockets.delete(socketId);

  if (activeSockets.size > 0) return;

  onlineUserSocketIdsByUserId.delete(normalizedUserId);
  const lastSeenAt = new Date();
  userLastSeenAtByUserId.set(normalizedUserId, lastSeenAt);

  User.findByIdAndUpdate(
    normalizedUserId,
    { supportLastSeenAt: lastSeenAt },
    { new: false },
  ).catch(() => {});
}

function activateSupportUserForSocket(socket, userId) {
  if (!userId) return;

  const normalizedUserId = String(userId);
  const previousUserId = socket.data.supportUserId;

  if (previousUserId && String(previousUserId) !== normalizedUserId) {
    setUserOfflineIfNeeded(previousUserId, socket.id);
    socket.leave(`support:user:${previousUserId}`);
    broadcastUserSupportStatus(previousUserId);
  }

  socket.data.supportUserId = normalizedUserId;
  setUserOnline(normalizedUserId, socket.id);
  socket.join(`support:user:${normalizedUserId}`);

  User.findByIdAndUpdate(
    normalizedUserId,
    { supportLastSeenAt: null },
    { new: false },
  ).catch(() => {});

  broadcastUserSupportStatus(normalizedUserId);
}

function deactivateSupportUserForSocket(socket) {
  const currentUserId = socket.data.supportUserId;
  if (!currentUserId) return;

  setUserOfflineIfNeeded(currentUserId, socket.id);
  broadcastUserSupportStatus(currentUserId);
}

function initializeSocket(server) {
  const { Server } = require("socket.io");

  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    socket.data.supportUserId = null;

    socket.on("join:user", (userId) => {
      activateSupportUserForSocket(socket, userId);
    });

    socket.on("support:user:active", (payload) => {
      if (typeof payload === "string") {
        activateSupportUserForSocket(socket, payload);
        return;
      }

      const payloadUserId = payload?.userId;
      activateSupportUserForSocket(socket, payloadUserId || socket.data.supportUserId);
    });

    socket.on("support:user:inactive", () => {
      deactivateSupportUserForSocket(socket);
    });

    socket.on("join:admin", () => {
      socket.join("support:admins");
    });

    socket.on("support:user-status:request", (payload, acknowledgeStatus) => {
      let requestedUserId = null;

      if (typeof payload === "string") {
        requestedUserId = payload;
      } else if (payload && typeof payload === "object") {
        requestedUserId = payload.userId;
      }

      if (!requestedUserId) return;

      resolveUserSupportStatus(requestedUserId)
        .then((statusPayload) => {
          if (typeof acknowledgeStatus === "function") {
            acknowledgeStatus(statusPayload);
            return;
          }

          socket.emit("support:user-status", statusPayload);
        })
        .catch(() => {
          const fallbackPayload = getUserSupportStatus(requestedUserId);

          if (typeof acknowledgeStatus === "function") {
            acknowledgeStatus(fallbackPayload);
            return;
          }

          socket.emit("support:user-status", fallbackPayload);
        });
    });

    socket.on("disconnect", () => {
      deactivateSupportUserForSocket(socket);
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