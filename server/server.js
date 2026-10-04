const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

const PORT = 3000;

// Allows the server to understand JSON data
app.use(express.json());

// Temporary task data
const tasks = [
    "Finish Cloud Homework",
    "Study REST APIs",
    "Work on Inbox Simulator"
];

// Basic route
app.get("/", (req, res) => {
    res.send("Student Task Manager Server is running!");
});

// GET endpoint - sends task data
app.get("/tasks", (req, res) => {
    res.json({
        status: "success",
        tasks: tasks
    });
});

// POST endpoint - receives a new task
app.post("/tasks", (req, res) => {

    const newTask = req.body.task;

    // Make sure a task was provided
    if (!newTask) {
        return res.status(400).json({
            status: "error",
            message: "A task is required."
        });
    }

    // Add task to our array
    tasks.push(newTask);

    // Send response back to client
    res.json({
        status: "success",
        message: "Task added successfully.",
        task: newTask
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});