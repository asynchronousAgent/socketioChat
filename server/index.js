const express = require("express");
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = socketio(server);
const users = [];
const messageBody = [];

io.on("connection", (socket) => {
  console.log("New connection", socket.id);
  socket.on("join-room", async (obj) => {
    await socket.join(obj.room);
    const individualObj = {};
    individualObj[obj.id] = [];
    individualObj.room = obj.room;
    messageBody.push(individualObj);
    users.push({ user: obj.user, room: obj.room });
    const join_detail = {
      room: obj.room,
      user: obj.user,
      joined: `${obj.user} has joined`,
      online: users,
    };
    console.log(users);
    // await socket.to(obj.room).emit("joining", join_detail);
    await io.to(obj.room).emit("online", join_detail.online);

    messageBody.forEach((peruser) => {
      if (!(socket.id in peruser) && peruser.room === obj.room) {
        console.log(!(socket.id in peruser));
        Object.entries(peruser)[0][1].push(join_detail);
      }
    });
    console.log(individualObj);
    await socket.to(obj.room).emit("joining", messageBody);
    console.log("this is message ", messageBody);

    socket.on("disconnecting", async () => {
      users.splice(
        users.findIndex(
          (val) => val.room === obj.room && val.user === obj.user
        ),
        1
      );
      const left_detail = {
        room: obj.room,
        user: obj.user,
        left: `${obj.user} has left`,
        online: users,
      };
      console.log(users);
      // await socket.to(obj.room).emit("left", left_detail);
      messageBody.forEach((peruser) => {
        if (peruser.room === obj.room)
          Object.entries(peruser)[0][1].push(left_detail);
      });

      messageBody.splice(
        messageBody.findIndex((val) => socket.id in val),
        1
      );
      await socket.to(obj.room).emit("left", messageBody);
      await socket.to(obj.room).emit("offline", left_detail);
      console.log("this is message ", messageBody);
    });
  });

  socket.on("send-message", async (response) => {
    // await socket.to(response.room).emit("recieve-message", response);
    messageBody.forEach((peruser) => {
      if (peruser.room === response.room)
        Object.entries(peruser)[0][1].push(response);
    });
    // console.log(individualObj);

    await io.to(response.room).emit("recieve-message", messageBody);
    console.log("this is message ", messageBody);
  });

  socket.on("share-location", async (response) => {
    const locationDetails = {
      room: response.room,
      user: response.user,
      location: `https://google.com/maps?q=${response.lat},${response.lon}`,
    };
    // await io.to(response.room).emit("receive-location", locationDetails);

    messageBody.forEach((peruser) => {
      if (peruser.room === response.room)
        Object.entries(peruser)[0][1].push(locationDetails);
    });
    // console.log(individualObj);

    await io.to(response.room).emit("receive-location", messageBody);
    console.log("this is message ", messageBody);
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server up and running on port ${port}`));
