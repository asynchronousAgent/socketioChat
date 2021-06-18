import { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const url = "http://localhost:5000/";
let socket;

function App() {
  const [present, setPresent] = useState(false);
  const [room, setRoom] = useState("");
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  useEffect(() => {
    socket = io(url, { transports: ["websocket", "polling", "flashsocket"] });
  }, []);

  useEffect(() => {
    socket.on("joining", (data) => {
      setMessageList([...messageList, { joined: data }]);
    });
    socket.on("recieve-message", (responseData) =>
      setMessageList([...messageList, responseData])
    );
  });

  const connectRoom = () => {
    setPresent(true);
    socket.emit("join-room", { room, user });
  };

  const sendMessage = () => {
    let messageDetails = {
      room,
      content: {
        user,
        message,
      },
    };
    socket.emit("send-message", messageDetails);
    setMessageList([...messageList, messageDetails.content]);
    setMessage("");
  };

  return (
    <div className="App">
      {!present ? (
        <div className="Present">
          <div className="inputs">
            <input
              placeholder="Enter name"
              onChange={(e) => setUser(e.target.value)}
            />
            <input
              placeholder="Enter RoomName"
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
          <button onClick={connectRoom}>Join Room</button>
        </div>
      ) : (
        <div className="chatbox">
          <div className="messages">
            {messageList.map((val, id) => {
              return (
                <>
                  {val.joined ? (
                    <div className="joinee">{val.joined}</div>
                  ) : (
                    <div className="singleMessage" key={id}>
                      {val.user} {val.message}
                    </div>
                  )}
                </>
              );
            })}
          </div>
          <div className="startMessage">
            <input
              placeholder="Type something..."
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
