const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const reloadButton = document.getElementById("reloadButton");

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const task = taskInput.value;

    if (task.trim() === "") {
        return;
    }

    const taskElement = document.createElement("div");

    taskElement.classList.add("task");

    taskElement.textContent = task;

    taskList.appendChild(taskElement);

    taskInput.value = "";
});

reloadButton.addEventListener("click", function() {
    console.log("Reload button clicked");
});