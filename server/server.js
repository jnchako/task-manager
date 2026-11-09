
const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const { CognitoJwtVerifier } = require("aws-jwt-verify");

const app = express();

app.use(cors());

// Allow browser preflight requests without authentication
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "10kb" }));

const PORT = process.env.PORT || 8080;

// DynamoDB configuration
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-2"
});

const dynamoDB = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "task-manager";

const verifier = CognitoJwtVerifier.create({
    userPoolId: "us-east-2_ngnekevYF",
    tokenUse: "access",
    clientId: "5ipc21is90ci2ti6d5m34ir82p"
});

async function authenticateUser(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "error",
            message: "Authentication required."
        });
    }

    const token = authorization.substring(7);

    try {
        const payload = await verifier.verify(token);

        // Cognito's verified unique user identifier
        req.userId = payload.sub;

        next();
    } catch (error) {
        console.error("Authentication failed:", error.message);

        return res.status(401).json({
            status: "error",
            message: "Invalid or expired authentication token."
        });
    }
}



// Validate and sanitize task input
function validateTask(task) {
    if (typeof task !== "string") {
        return null;
    }

    const cleaned = task.trim();

    if (cleaned.length === 0 || cleaned.length > 200) {
        return null;
    }

    return cleaned;
}

// Home route
app.get("/", (req, res) => {
    res.send("Student Task Manager Server is running!");
});

// GET tasks from DynamoDB
app.get("/tasks", authenticateUser, async (req, res) => {
    try {
        const result = await dynamoDB.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: {
                    ":userId": req.userId
                }
            })
        );

        const tasks = (result.Items || []).map(
            item => item.title
        );

        res.json({
            status: "success",
            tasks: tasks
        });

    } catch (error) {
        console.error("Error retrieving tasks:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to retrieve tasks."
        });
    }
});

// POST a new task to DynamoDB
app.post("/tasks", authenticateUser, async (req, res) => {
    try {
        const newTask = validateTask(req.body?.task);

        if (!newTask) {
            return res.status(400).json({
                status: "error",
                message: "Task must be between 1 and 200 characters."
            });
        }

        const taskItem = {
            userId: req.userId,
            taskId: randomUUID(),
            title: newTask,
            completed: false,
            createdAt: new Date().toISOString()
        };

        await dynamoDB.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: taskItem
            })
        );

        res.status(201).json({
            status: "success",
            message: "Task added successfully.",
            task: newTask
        });

    } catch (error) {
        console.error("Error saving task:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to save task."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
