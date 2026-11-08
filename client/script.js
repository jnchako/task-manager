const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const reloadButton = document.getElementById("reloadButton");

const API_URL = "https://mia1te0nv5.execute-api.us-east-2.amazonaws.com";

// Load tasks from server
async function loadTasks() {

    const response = await fetch(`${API_URL}/tasks`);

    const data = await response.json();

    taskList.innerHTML = "";

    data.tasks.forEach(function(task) {

        const taskElement = document.createElement("div");

        taskElement.classList.add("task");

        taskElement.textContent = task;

        taskList.appendChild(taskElement);
    });
}

// Add a task to server
taskForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const task = taskInput.value;

    if (task.trim() === "") {
        return;
    }

    await fetch(`${API_URL}/tasks`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            task: task
        })
    });

    taskInput.value = "";

    loadTasks();
});

// Reload tasks
reloadButton.addEventListener("click", function() {
    loadTasks();
});

// Load tasks when page opens
loadTasks();