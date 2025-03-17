// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// importing pages into app
import Home from "./pages/Home"; // home
import PlayOnline from "./pages/PlayOnline"; // playonline
import ChessBoard from "./pages/ChessBoard"; // play online chess board
import Profile from "./pages/Profile"; // profile
import PlayBotOptions from "./pages/PlayBotOptions"; // bot chess board options
import BotChessBoard from "./pages/BotChessBoard"; // bot chessborad
import PlayRandom from "./pages/PlayRandom"; // play random chess board

// imporitng components
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";

import "./styles/Login.css";


// app component
export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  return (
    <Router>
      <div className="chessboard">
        {token ? (
          <Routes>

            {/* different routes */}
            <Route path="/" element={<Home />} />
            <Route path="/PlayOnline" element={<PlayOnline />} />
            <Route path="/chessBoard" element={<ChessBoard />} /> 
            <Route path="/Profile" element={<Profile />} />
            <Route path="/PlayBotOptions" element={<PlayBotOptions />} />
            <Route path="/ai-chessboard" element={<BotChessBoard />} />
            <Route path="/Play-Random" element={<PlayRandom />} />
          </Routes>
        ) : isLogin ? (
          <LoginPage
            onSwitch={() => setIsLogin(false)}
            onLogin={(token) => {
              localStorage.setItem("token", token);
              setToken(token);
            }}
          />
        ) : (
          <RegisterPage onSwitch={() => setIsLogin(true)} />
        )}
      </div>
    </Router>
  );
}
