// play random code which displays chess board like chessboard.js
// similar logic with naming differences


// imports
import React, { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useLocation } from "react-router-dom";
import socket from "../components/socket.jsx";
import "../styles/ChessBoard.css";

// reading the url
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};


// retrieving the data from the url
export default function ChessBoard() {
  const query = useQuery();
  const roomId = query.get("roomId");
  const color = query.get("color")?.toLowerCase() || "white";
  const opponent = query.get("opponent");

  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [highlightSquares, setHighlightSquares] = useState({});
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const chatEndRef = useRef(null);


  // scroll to bottom for chat section 
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  // game over logic
  const handleGameOver = ({ message = "Game Over" }) => {
    setStatusMessage(message);
    setGameStarted(false);
    setGame(new Chess()); 
    socket.emit("randomGameOver", {
      roomId,
      message,
      winnerRole: game.turn() === "w" ? "b" : "w", // The opposite of the current turn
    });
  };


  // start game logic
  const startGame = () => {
    setGame(new Chess());
    setPosition(game.fen());
    setGameStarted(true);
    setStatusMessage("Game Started. White to move!");
  };


  // handle square click
  const handleSquareClick = (square) => {
    try {
      if (!gameStarted) {
        console.error("Error: Game has not started yet.");
        return;
      }
  
      if (selectedSquare && highlightSquares[square]) {
        const piece = game.get(selectedSquare);
        if (piece && piece.color === color[0]) {
          const move = game.move({ from: selectedSquare, to: square });
          if (move) {
            socket.emit("randomPieceMove", {
              from: selectedSquare,
              to: square,
              roomId,
            }, (response) => {
              if (!response.success) {
                console.error("Error in piece move:", response.message);
                alert(`Error: ${response.message}`);
              } else {
                console.log("Move successful:", response.newGameState);
                setPosition(game.fen());
                setSelectedSquare(null);
                setHighlightSquares({});
                updateGameStatus();
              }
            });
          } else {
            console.error("Invalid move:", { from: selectedSquare, to: square });
            alert("Error: Invalid move.");
          }
        } else {
          console.error("Error: You can only move your own pieces.");
          alert("You can only move your own pieces!");
        }
      } else {
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
        } else {
          console.warn("Warning: No legal moves found for the selected square.");
          setHighlightSquares({});
          setSelectedSquare(null);
        }
      }
    } catch (error) {
      console.error("Error in handleSquareClick:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };
  

  // get logal moves
  const getLegalMoves = (square) => {
    return game.moves({ square, verbose: true });
  };


  // update the gamestatus
  const updateGameStatus = () => {
    if (game.isCheckmate()) {
      handleGameOver({ message: "Checkmate! Game Over." });
    } else if (game.isDraw()) {
      handleGameOver({ message: "It's a draw!" });
    } else if (game.isCheck()) {
      setStatusMessage("Check!");
    } else if (game.isGameOver()) {
      handleGameOver({ message: "Game Over!" });
    } else {
      setStatusMessage("");
    }
  };


  // handle surrender 
  const handleSurrender = () => {
    const currentColor = color === "white" ? "w" : "b";
    const winnerColor = currentColor === "w" ? "b" : "w";

    setStatusMessage(
      `${winnerColor === "w" ? "White" : "Black"} wins by surrender!`
    );
    setGameStarted(false);
    setGame(new Chess()); // Reset the game state
    socket.emit("randomSurrender", { roomId, winnerRole: winnerColor });

    // Emit gameOver event to notify the opponent
    socket.emit("randomGameOver", { roomId, message: `${winnerColor === "w" ? "White" : "Black"} wins by surrender!` });
  };


  // start game logic
  const handleStartGame = () => {
    socket.emit("randomStartGame", { roomId });
  };



  // chat code
  const handleReceiveMessage = (message) => {
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { ...message, type: "received" },
    ]);
    scrollToBottom();
  };


  // game stae update from the server
  const handleGameState = ({ fen }) => {
    setGame(new Chess(fen));
    setPosition(fen);
    updateGameStatus();
  };


  // set socket listeners only once when the components mounts and then remove them when componet unmounts
  useEffect(() => {
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("gameState", handleGameState);
    socket.on("startGame", startGame);
    socket.on("randomGameOver", handleGameOver);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("gameState", handleGameState);
      socket.off("startGame", startGame);
      socket.off("randomGameOver", handleGameOver);
    };
  }, [roomId]);



  // chat section
  const handleChatInputChange = (event) => {
    setChatInput(event.target.value);
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const message = { content: chatInput.trim(), type: "sent" };
      socket.emit("randomSendMessage", { roomId, message });
      setChatMessages((prevMessages) => [...prevMessages, message]);
      setChatInput("");
      scrollToBottom();
    }
  };



  // chessboard component
  return (
    <div className="app-container">
      <div className="game-status">
        <p>{statusMessage}</p>
      </div>
      <div className="user-section">
        <h2>
          {color === "white"
            ? "Black Player (Opponent)"
            : "White Player (Opponent)"}
        </h2>
      </div>
      <div className="chessboard-container">
        <Chessboard
          id="BasicBoard"
          position={position}
          arePiecesDraggable={false}
          onSquareClick={(square) => handleSquareClick(square)}
          customSquareStyles={highlightSquares}
          boardOrientation={color === "white" ? "white" : "black"}
        />
      </div>
      <div className="user-section">
        <h2>
          {color === "white" ? "White Player (You)" : "Black Player (You)"}
        </h2>
      </div>
      <div className="start-btn-container">
        {!gameStarted && (
          <button className="start-btn" onClick={handleStartGame}>
            Start Game
          </button>
        )}

        {gameStarted && (
          <button className="surrender-btn" onClick={handleSurrender}>
            Surrender
          </button>
        )}
      </div>
      <div className="chat-container">
        <div className="chat-messages">
          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${
                message.type === "sent" ? "sent" : "received"
              }`}
            >
              <p>{message.content}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={chatInput}
            onChange={handleChatInputChange}
            placeholder="Type your message..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
