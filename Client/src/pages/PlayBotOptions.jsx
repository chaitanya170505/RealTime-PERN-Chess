// play bot options code to select what time, side, time user wanna play

import React, { useState } from "react";
import Header from "../components/Header.jsx";
import { useNavigate } from "react-router-dom";
import "../styles/PlayBotOptions.css";
import Footer from "../components/Footer.jsx";

const GameSelection = () => {
  const [gameDuration, setGameDuration] = useState("15");
  const [playerColor, setPlayerColor] = useState("White");
  const [difficulty, setDifficulty] = useState("Medium");
  const navigate = useNavigate();

  const handleStartGame = () => {
    // converting game duration from minutes to seconds
    const durationInSeconds = parseInt(gameDuration) * 60;
    navigate(`/ai-chessboard?time=${durationInSeconds}&side=${playerColor}&difficulty=${difficulty}`);
  };

  return (
    <div>
      <Header />
      <hr />
      <div className="chess-setup-wrapper">
        <div className="chess-setup-box">
          <h1 className="chess-title">Setup Your Game</h1>

          <div className="chess-selection-group">
            <label className="chess-label">Game Duration:</label>
            <select
              className="chess-dropdown"
              value={gameDuration}
              onChange={(e) => setGameDuration(e.target.value)}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
            </select>
          </div>

          <div className="chess-selection-group">
            <label className="chess-label">Select Side:</label>
            <select
              className="chess-dropdown"
              value={playerColor}
              onChange={(e) => setPlayerColor(e.target.value)}
            >
              <option value="White">White</option>
              <option value="Black">Black</option>
            </select>
          </div>

          <div className="chess-selection-group">
            <label className="chess-label">Select Difficulty:</label>
            <select
              className="chess-dropdown"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <button className="chess-start-button" onClick={handleStartGame}>
            Start Game
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GameSelection;
