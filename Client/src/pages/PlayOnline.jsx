// play online sections where players choose side, time, join, create


// imports
import React, { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import socket from "../components/socket.jsx"; 
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; 
import "../styles/PlayOnline.css";
import Footer from "../components/Footer.jsx";



const PlayOnline = () => {
  const [gameDuration, setGameDuration] = useState("15");
  const [color, setColor] = useState("Black");
  const [roomId, setRoomId] = useState("");
  const [generatedRoomId, setGeneratedRoomId] = useState("");
  const [username, setUsername] = useState(""); 
  const navigate = useNavigate();


  // get the token from local storage to decode it to get username
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.username) {
          setUsername(decoded.username); 
        } else {
          console.error("Username not found in token");
        }
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  }, []);


  // create room button
  const handleCreateRoom = () => {
    if (!socket.connected) {
      alert("Connection to server lost. Please check your internet connection.");
      return;
    }

    if (!username) {
      alert("User information missing. Please log in again.");
      return;
    }

    const roomDetails = { gameDuration, color, username };

    // emit create room event to the server
    socket.emit("createGame", roomDetails, (response) => {
      if (response?.roomId) {
        setGeneratedRoomId(response.roomId);
        navigate(
          `/chessBoard?roomId=${response.roomId}&gameDuration=${gameDuration}&color=${color}&username=${username}`
        );
      } else {
        alert(response?.message || "Error creating room. Please try again.");
      }
    });
  };



  // join room button
  const handleJoinRoom = () => {
    if (!socket.connected) {
      alert("Connection to server lost. Please check your internet connection.");
      return;
    }

    if (!roomId.trim()) {
      alert("Please enter a valid Room ID.");
      return;
    }

    // join room event to the server 
    socket.emit("joinGame", { roomId, username }, (response) => {
      if (response?.success) {
        alert(`Successfully joined room with ID: ${roomId}`);
        navigate(
          `/chessBoard?roomId=${roomId}&gameDuration=${response.gameDuration}&color=${response.role}&username=${username}`
        );
      } else {
        alert(response?.message || "Error joining room.");
      }
    });
  };

  // copy room id button which i could'nt use due to design constraints
  const handleCopyRoomId = () => {
    if (!generatedRoomId) {
      alert("No Room ID to copy.");
      return;
    }

    navigator.clipboard
      .writeText(generatedRoomId)
      .then(() => alert("Room ID copied to clipboard!"))
      .catch(() => alert("Failed to copy Room ID."));
  };



  return (
    <div>
      <Header />
      <hr />
      <div className="play-online-wrapper">
        <div className="play-online-container">
          <h1>Create a Room</h1>
          <p>Welcome, <strong>{username || "Guest"}</strong></p>
          <div className="game-options">
            <label>Game Duration:</label>
            <select
              value={gameDuration}
              onChange={(e) => setGameDuration(e.target.value)}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
            </select>
          </div>

          <div className="color-selection">
            <label>Select Side:</label>
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="Black">Black</option>
              <option value="White">White</option>
            </select>
          </div>

          <button onClick={handleCreateRoom}>Create Room</button>

          {generatedRoomId && (
            <div className="generated-room">
              <h3>Room Created Successfully!</h3>
              <p>Room ID: {generatedRoomId}</p>
              <button onClick={handleCopyRoomId}>Copy Room ID</button>
            </div>
          )}

          <hr />

          <div className="join-room-container">
            <h2>Join a Room</h2>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={handleJoinRoom}>Join Room</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PlayOnline;
