// Create web server

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

// Get all comments of a post
app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create new comment
app.post("/posts/:id/comments", async (req, res) => {
  const commentId = Math.random().toString(36).substring(2);
  const { content } = req.body;

  // Get comments of a post
  const comments = commentsByPostId[req.params.id] || [];

  // Push new comment to comments array
  comments.push({ id: commentId, content, status: "pending" });

  // Save comments array to commentsByPostId object
  commentsByPostId[req.params.id] = comments;

  // Send event to Event Bus
  await axios.post("http://localhost:4005/events", {
    type: "CommentCreated",
    data: { id: commentId, content, postId: req.params.id, status: "pending" },
  });

  res.status(201).send(comments);
});

// Receive event from Event Bus
app.post("/events", async (req, res) => {
  console.log("Event Received: ", req.body.type);

  const { type, data } = req.body;

  // Check if type is CommentModerated
  if (type === "CommentModerated") {
    // Get comments of a post
    const comments = commentsByPostId[data.postId];

    // Find comment by id
    const comment = comments.find((comment) => {
      return comment.id === data.id;
    });

    // Change status of comment
    comment.status = data.status;

    // Send event to Event Bus
    await axios.post("http://localhost:4005/events", {
      type: "CommentUpdated",
      data,
    });
  }

  res.send({});
});

app.listen(4001, () => {
  console.log("Listening on port 4001");
});
