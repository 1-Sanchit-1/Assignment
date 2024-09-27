const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const db_connect = require("./config/dbConfig");
const User = require("./models/User"); // Import User model

require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: "http://localhost:3000", // Replace with your frontend URL
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: corsOptions,
});

app.use(bodyParser.json());

const notifications = {};
const userSockets = {};

// Start the server
const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
app.use("/api", authRoute);

db_connect
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("Server startup error:", err));

app.get("/", (req, res) => {
  res.send("Server Running !!");
});
app.get("/", (req, res) => {
  res.send("Server is running fine");
});

// Add API to create a new user
app.post("/api/users", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const newUser = new User({ username, email, password });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating user", error: error.message });
  }
});

// Example API to fetch all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// Send Notification API
app.post("/api/notifications/send", (req, res) => {
  const { target, userId, message, source, timestamp } = req.body;

  const newNotification = {
    id: Date.now().toString(), // Add a unique id to each notification
    message,
    status: "unread",
    timestamp,
  };

  console.log(`Sending notification: ${JSON.stringify(newNotification)}`);

  // For specific user notification
  if (target === "specific") {
    if (!notifications[userId]) {
      notifications[userId] = [];
    }
    notifications[userId].push(newNotification);

    // Send notification to the specific user if they are connected
    if (userSockets[userId]) {
      io.to(userSockets[userId]).emit("notification", newNotification);
      console.log(`Sent notification to user ${userId}`);
    } else {
      console.log(`User ${userId} not connected, notification stored`);
    }
  }
  // For broadcast (send to all users)
  else if (target === "broadcast") {
    console.log("Broadcasting notification to all users");
    io.emit("notification", newNotification); // Use io.emit for broadcasting

    // Save notification for each known user
    for (let user in userSockets) {
      if (!notifications[user]) {
        notifications[user] = [];
      }
      notifications[user].push(newNotification);
      console.log(`Stored broadcast notification for user ${user}`);
    }
  }

  res.status(200).json({ message: "Notification sent successfully" });
});

// Fetch Notifications API
app.get("/api/notifications/:userId", (req, res) => {
  const { userId } = req.params;
  const userNotifications = notifications[userId] || [];
  res.status(200).json(userNotifications);
});

// Mark Notifications as Read API
app.post("/api/notifications/read", (req, res) => {
  const { userId, notificationIds } = req.body;

  if (notifications[userId]) {
    notifications[userId] = notifications[userId].map((notif) => {
      if (notificationIds.includes(notif.id)) {
        return { ...notif, status: "read" };
      }
      return notif;
    });
  }

  res.status(200).json({ message: "Notifications marked as read" });
});

// Real-Time Notification using WebSockets
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("register", (userId) => {
    console.log(`User registered: ${userId} with socket ${socket.id}`);
    userSockets[userId] = socket.id;
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    for (let user in userSockets) {
      if (userSockets[user] === socket.id) {
        delete userSockets[user];
        console.log(`User ${user} disconnected`);
        break;
      }
    }
  });
});
