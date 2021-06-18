const express = require("express");
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  console.log("New connection", socket.id);

  socket.on("join-room", (obj) => {
    socket.join(obj.room);
    console.log("user joined room: " + obj.room);
    socket.to(obj.room).emit("joining", `${obj.user} has joined!`);
  });

  socket.on("send-message", (response) => {
    console.log(response);
    socket.to(response.room).emit("recieve-message", response.content);
  });

  socket.on("disconnect", () => {
    console.log("user has left");
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server up and running on port ${port}`));
