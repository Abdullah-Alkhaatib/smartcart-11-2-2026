import { io } from "socket.io-client";
import API_URL from "../config/api";

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  return socketInstance;
}
