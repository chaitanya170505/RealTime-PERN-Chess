// play against ai (stockfish)


import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "../styles/BotChessBoard.css";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; 

export default function App() {
  const [game, setGame] = useState(null); // game state 
  const [highlightSquares, setHighlightSquares] = useState({}); 
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Click Start to Begin");
  const [engine, setEngine] = useState(null);
  const [whiteTime, setWhiteTime] = useState(600); // Timer for White (default 600)
  const [blackTime, setBlackTime] = useState(600); // Timer for Black (default 600)
  const [difficulty, setDifficulty] = useState(15); // Difficulty level (default to 15)
  const [side, setSide] = useState("white"); // Player's side
  const [username, setUsername] = useState(""); // Username from JWT token
  const timerRef = useRef(null); 

  const location = useLocation(); // to retrive data from the url 

  useEffect(() => {
    // Retrieving and decoding JWT token to extract username
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



  useEffect(() => {
    const stockfishWorker = new Worker("/stockfish.js"); // from public folder
    stockfishWorker.postMessage("uci");// initialize 
    setEngine(stockfishWorker);// save the instance

    // using the url to retrieve data of the type of game to create
    const queryParams = new URLSearchParams(location.search); 
    const time = parseInt(queryParams.get("time")) || 600;
    const side = queryParams.get("side") || "white";
    const difficulty = queryParams.get("difficulty") || "Medium";

    setWhiteTime(time);
    setBlackTime(time);
    setSide(side.toLowerCase());
    setDifficulty(mapDifficultyToDepth(difficulty));
  }, [location.search]);




  useEffect(() => {
    if (game) {
      if (game.turn() === "w") { // if its white turn 
        clearInterval(timerRef.current); // clear any previous saves of use ref which stops the blacks timer if running
        timerRef.current = setInterval(() => { // use set interval to update the white timer 
          setWhiteTime((time) => Math.max(time - 1, 0));
        }, 1000);
      } else {
        clearInterval(timerRef.current); // if its black turn use the same logic and update the black's timer
        timerRef.current = setInterval(() => {
          setBlackTime((time) => Math.max(time - 1, 0));
        }, 1000);
      }

      return () => clearInterval(timerRef.current);
    }
  }, [game]);


  // set both the timers to 0 after game end 
  useEffect(() => {
    if (whiteTime === 0 || blackTime === 0) {
      handleGameEnd();
    }
  }, [whiteTime, blackTime]);


  // handling check mate and draw conditions 
  useEffect(() => {
    if (game && (game.isCheckmate() || game.isDraw())) {
      handleGameEnd();
    }
  }, [game]);

  // modifying the difficulty 
  const mapDifficultyToDepth = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return 10;
      case "Medium":
        return 15;
      case "Hard":
        return 20;
      default:
        return 15;
    }
  };


  // start game button 
  const startGame = () => {
    const newGame = new Chess();// new chess instance
    setGame(newGame); // set it to game 
    setWhiteTime(whiteTime); // initialize value to white and black timers
    setBlackTime(blackTime);
    setStatusMessage(
      `Game started! You are playing as ${side === "white" ? "White" : "Black"}`
    );

    // If the player is Black, make the AI (White) move first
    if (side === "black") {
      makeAIMove(newGame); // don't wait for piece move to use the fucntion directly use it
      setStatusMessage("AI is thinking...");
    }
  };


  // get legal move for a square
  const getLegalMoves = (square) => {
    return game.moves({ square, verbose: true });
  };


  // how to make the ai move the pieces
  const makeAIMove = (currentGame) => {
    if (!engine) return; 

    const gameToUse = currentGame || game; // use current game instance

    engine.postMessage(`position fen ${gameToUse.fen()}`);// post the message to the stockfish
    engine.postMessage(`go depth ${difficulty}`);// mention difficulty

    engine.onmessage = (event) => {
      const data = event.data;
      if (typeof data === "string" && data.startsWith("bestmove")) {
        const move = data.split(" ")[1]; // split bestmove d3d5 to d3d5
        if (move) {
          const newGame = new Chess(gameToUse.fen()); 
          newGame.move({ from: move.slice(0, 2), to: move.slice(2, 4) }); // slice the move like d3 to d4
          setGame(newGame);
          setStatusMessage("Your Turn (White)");
        }
      }
    };
  };


  // handling board click pieces, empty square, invalid....
  const handleSquareClick = (square) => {
    if (!game || game.isCheckmate() || game.isDraw()) return;

    const piece = game.get(square);
    if (selectedSquare && highlightSquares[square]) {
      const move = game.move({ from: selectedSquare, to: square });
      if (move) {
        setGame(new Chess(game.fen()));
        setStatusMessage("AI is thinking...");
        setTimeout(() => makeAIMove(game), 500);
      }
      setSelectedSquare(null);
      setHighlightSquares({});
    } else {
      if (piece && piece.color !== side.charAt(0)) {
        setStatusMessage(`You can only move ${side} pieces`);
        return;
      }
      const moves = getLegalMoves(square);
      if (moves.length > 0) {
        const highlights = moves.reduce((acc, move) => {
          acc[move.to] = move.captured
            ? { background: "rgba(255, 0, 0, 0.5)" }
            : { background: "rgba(0, 255, 0, 0.5)" };
          return acc;
        }, {});
        setHighlightSquares(highlights);
        setSelectedSquare(square);
        setStatusMessage(`Selected square: ${square}`);
      } else {
        setHighlightSquares({});
        setSelectedSquare(null);
        setStatusMessage(`No legal moves for square: ${square}`);
      }
    }
  };


  // fotmat the time seconds into minutes and seconds
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };


  // game end handling
  const handleGameEnd = () => {
    clearInterval(timerRef.current); 
    let result = "";
    if (whiteTime === 0) {
      result = side === "white" ? "loss" : "win";
    } else if (blackTime === 0) {
      result = side === "white" ? "win" : "loss";
    } else if (game.isCheckmate()) {
      result = game.turn() === side.charAt(0) ? "loss" : "win";
    } else if (game.isDraw()) {
      result = "draw";
    }
    updateGameResult(username, result);
    setStatusMessage(`Game over! Result: ${result}`);
  };


  // updating game result to the db
  const updateGameResult = async (username, result) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/ai-game-result",
        { username, result },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        console.log("Game result updated successfully");
      } else {
        console.error("Error updating game result");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };


  // handling surrender button
  const handleSurrender = async () => {
    clearInterval(timerRef.current); // used along with set interval 
    // set interval sets instance id and clearinterval clears it
    const result = side === "white" ? "loss" : "win";// who won
    updateGameResult(username, result); // update the db using username
    setStatusMessage(`You surrendered! Result: ${result}`); // notify the players 
    setGame(null); // stop game or claer gams instance
  };


  /// board component
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Chess with Stockfish AI</h1>
        <p>
          Play against Stockfish (AI) as {side === "white" ? "Black" : "White"}
        </p>
      </header>

      <main className="app-main">
        {game && (
          <>
            <div className="timers-container">
              <div className="game-status2">
                <p>{statusMessage}</p>
              </div>
              <div className="top-timer timer">
                {side === "white"
                  ? `Black: ${formatTime(blackTime)}`
                  : `White: ${formatTime(whiteTime)}`}
              </div>
              <div className="chessboard-container">
                <Chessboard
                  position={game.fen()}
                  onSquareClick={handleSquareClick}
                  customSquareStyles={highlightSquares}
                  boardOrientation={side === "white" ? "white" : "black"} 
                  arePiecesDraggable={false} // Make pieces non-draggable
                />
              </div>
              <div className="bottom-timer timer">
                {side === "white"
                  ? `White: ${formatTime(whiteTime)}`
                  : `Black: ${formatTime(blackTime)}`}
              </div>
            </div>
            <button onClick={handleSurrender} className="button">
              Surrender
            </button>
          </>
        )}
        {!game && (
          <button onClick={startGame} className="button">
            Start Game
          </button>
        )}
      </main>
    </div>
  );
}
