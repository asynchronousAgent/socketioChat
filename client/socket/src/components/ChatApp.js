import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import io from "socket.io-client";

const url = process.env.REACT_APP_BACKEND_URL;
let socket;

function ChatApp() {
  const [present, setPresent] = useState(false);
  const [room, setRoom] = useState("");
  const [user, setUser] = useState("");
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");
  const [onlineUser, setOnlineUser] = useState([]);
  const [messageList, setMessageList] = useState([]);
  const sendMessageFocus = useRef(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    socket = io(url, { transports: ["websocket", "polling", "flashsocket"] });
  }, []);

  useEffect(() => {
    socket.on("joining", (data) => {
      // setMessageList([...messageList, { joined: data.joined }]);
      setMessageList(data);
    });
    socket.on("online", (onlinedata) => {
      setOnlineUser(onlinedata);
    });
    socket.on("recieve-message", (responseData) =>
      // setMessageList([...messageList, responseData])
      setMessageList(responseData)
    );
    socket.on("receive-location", (responseData) => {
      // setMessageList([...messageList, responseData]);
      setMessageList(responseData);
    });
    socket.on("left", (data) => {
      // setMessageList([...messageList, { left: data.left }]);
      setMessageList(data);
      // setOnlineUser(data.online);
    });
    socket.on("offline", (data) => {
      setOnlineUser(data.online);
    });
  });

  const connectRoom = () => {
    setPresent(true);
    setId(socket.id);
    socket.emit("join-room", { room, user, id: socket.id });
  };

  const sendMessage = () => {
    let messageDetails = {
      room,
      user,
      message,
    };
    socket.emit("send-message", messageDetails);
    // setMessageList([...messageList, messageDetails]);
    setMessage("");
    sendMessageFocus.current.focus();
  };

  const locationHandler = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const locationDetails = {
        room,
        user,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      };
      socket.emit("share-location", locationDetails);
    });
    sendMessageFocus.current.focus();
  };
  return (
    <React.Fragment>
      {!present ? (
        <div className="Present">
          <div className="front">JhatSe Chat</div>
          <form className="form-control" onSubmit={handleSubmit(connectRoom)}>
            <div className="inputs">
              <input
                placeholder="Your Name"
                {...register("user", { required: true, maxLength: 12 })}
                value={user}
                autoFocus
                autoComplete="off"
                onChange={(e) => setUser(e.target.value)}
              />
              <input
                placeholder="Enter Room Name Or ID"
                {...register("room", { required: true, maxLength: 12 })}
                value={room}
                autoComplete="off"
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
            <div className="form-error">
              <div className="blank-error">
                {errors.user?.type === "required" && "Your name is required"}
                {errors.user?.type === "maxLength" &&
                  "Name should contain maximum of 12 characters"}
              </div>
              <div className="blank-error">
                {errors.room?.type === "required" && "Please enter room name"}
                {errors.room?.type === "maxLength" &&
                  "Room should contain maximum of 12 characters"}
              </div>
            </div>
            <button type="submit">Join Room</button>
          </form>
        </div>
      ) : (
        <div className="chatbox">
          <div className="wrapper">
            <div className="online">
              <div className="roomname">Room Name</div>
              <i style={{ color: "red" }}>{room}</i>
              <div style={{ paddingTop: 16 }}></div>
              <button
                className="leave-button"
                onClick={() => window.location.reload()}
              >
                Leave Room
              </button>
              <div style={{ paddingTop: 35 }}></div>
              {onlineUser.map((val, id) => {
                return (
                  <>
                    {val.room === room && (
                      <div className="online-user" key={id}>
                        <span className="dot"></span>
                        <span className="each-user">{val.user}</span>
                      </div>
                    )}
                  </>
                );
              })}
            </div>
            <div className="messages">
              {messageList.map(
                (client) =>
                  id in client &&
                  client[id].map((val, id) => {
                    return (
                      <>
                        {val.joined ? (
                          <div className="joinee" key={id + "joinee"}>
                            {val.joined}&#128540;
                          </div>
                        ) : (
                          !val.left && (
                            <div
                              className="single"
                              key={id + "single"}
                              id={val.user === user ? "You" : "Other"}
                              style={
                                val.message && val.message.length < 37
                                  ? { width: val.message.length * 10 + 50 }
                                  : { width: 410 }
                              }
                            >
                              {/* width: val.location.length * 9 */}
                              <div className="only-user" key={id + "only-user"}>
                                {val.user === user ? "You" : val.user}
                              </div>
                              <div
                                className="singleMessage"
                                key={id + "singleMessage"}
                              >
                                {val.message}
                              </div>
                              {val.location && (
                                <a
                                  href={val.location}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="location"
                                  key={id + "location"}
                                >
                                  {val.location}
                                </a>
                              )}
                            </div>
                          )
                        )}
                        {val.left && (
                          <div className="joinee" key={id + "left"}>
                            {val.left}&#128546;
                          </div>
                        )}
                      </>
                    );
                  })
              )}
            </div>
          </div>
          <div className="startMessage">
            <input
              placeholder="Type something..."
              autoFocus
              ref={sendMessageFocus}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {message.length !== 0 ? (
              <button style={{ fontSize: 21 }} onClick={sendMessage}>
                Send
              </button>
            ) : (
              <button onClick={locationHandler}>Share Location</button>
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

export default ChatApp;
