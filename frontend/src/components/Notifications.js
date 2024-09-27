import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import axios from "axios";

const SERVER_URL = "http://localhost:5000";

const socket = io(SERVER_URL);

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [broadcast, setBroadcast] = useState(false);

  const handleNotification = useCallback((newNotification) => {
    console.log("Received notification:", newNotification);
    setNotifications((prev) => [...prev, newNotification]);
  }, []);

  useEffect(() => {
    console.log("Setting up socket connection");
    socket.on("notification", handleNotification);

    return () => {
      console.log("Cleaning up socket connection");
      socket.off("notification", handleNotification);
    };
  }, [handleNotification]);

  useEffect(() => {
    if (userId) {
      console.log(`Registering user: ${userId}`);
      socket.emit("register", userId);
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${SERVER_URL}/api/notifications/${userId}`
      );
      console.log("Fetched notifications:", response.data);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const sendNotification = async () => {
    try {
      const payload = {
        target: broadcast ? "broadcast" : "specific",
        userId: broadcast ? null : userId,
        message,
        timestamp: new Date().toISOString(),
      };
      console.log("Sending notification:", payload);
      const response = await axios.post(
        `${SERVER_URL}/api/notifications/send`,
        payload
      );
      console.log("Notification sent:", response.data);
      setMessage("");
      if (broadcast) {
        handleNotification({
          ...payload,
          status: "unread",
          id: Date.now().toString(),
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`${SERVER_URL}/api/notifications/read`, {
        userId,
        notificationIds: [notificationId],
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, status: "read" } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Notification System</h1>

      <div className="mb-4">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          className="border p-2 mr-2"
        />
        <label className="ml-2">
          <input
            type="checkbox"
            checked={broadcast}
            onChange={(e) => setBroadcast(e.target.checked)}
            className="mr-1"
          />
          Broadcast to all users
        </label>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter notification message"
          className="border p-2 mr-2"
        />
        <button
          onClick={sendNotification}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Send Notification
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Notifications:</h2>
      <ul>
        {notifications.map((notif) => (
          <li key={notif.id} className="mb-2 p-2 border rounded">
            <p>{notif.message}</p>
            <p className="text-sm text-gray-500">
              Status: {notif.status} | Time:{" "}
              {new Date(notif.timestamp).toLocaleString()}
            </p>
            {notif.status === "unread" && (
              <button
                onClick={() => markAsRead(notif.id)}
                className="bg-green-500 text-white p-1 rounded mt-1 text-sm"
              >
                Mark as Read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationSystem;
