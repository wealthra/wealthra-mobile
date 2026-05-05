import * as signalR from "@microsoft/signalr";
import { API_URL } from "../axiosInstance";
import { getStoredToken } from "./authService";

export const createNotificationConnection = async (): Promise<signalR.HubConnection | null> => {
  const token = await getStoredToken();
  if (!token) {
    console.warn("SignalR: No token found, cannot create connection.");
    return null;
  }

  // Ensure the URL is absolute
  const hubUrl = `${API_URL}/hubs/notifications`;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => token,
      // SignalR usually handles the access_token query param automatically 
      // when using accessTokenFactory and WebSockets
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
};

export const startSignalRConnection = async (connection: signalR.HubConnection) => {
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    try {
      await connection.start();
      console.log("🚀 SignalR Connected.");
    } catch (err) {
      console.error("❌ SignalR Connection Error: ", err);
      // Re-try logic is handled by withAutomaticReconnect() for subsequent failures
    }
  }
};
