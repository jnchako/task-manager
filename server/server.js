const express = require("express");

const app = express();

const PORT = 3000;

// Allows the server to understand JSON data
app.use(express.json());

// Tasks data teporarily
const tasks = [
    "Finish Cloud Homework",
    "Study REST APIs",
    "Work on Inbox Simulator"
];

// Basic route
app.get("/", (req, res) => {
    res.send("Student Task Manager Server is running!");
});

// GET endpoint that returns task data
app.get("/tasks", (req, res) => {
    res.json({
        status: "success",
        tasks: tasks
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});