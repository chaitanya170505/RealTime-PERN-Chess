// imports
import React, { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useLocation } from "react-router-dom";
import socket from "../components/socket.jsx"; 
import "../styles/ChessBoard.css";


// use query to retrieve info from url
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// use the info to initialize the game
export default function ChessBoard() {
  const query = useQuery();
  const roomId = query.get("roomId");
  const gameDuration = parseInt(query.get("gameDuration"), 10) || 10; 
  const color = query.get("color")?.toLowerCase() || "white"; 
  console.log(color);

  // state variables
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [highlightSquares, setHighlightSquares] = useState({});
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [whiteTime, setWhiteTime] = useState(gameDuration * 60);
  const [blackTime, setBlackTime] = useState(gameDuration * 60);
  const [turn, setTurn] = useState("w");
  const [checkmateTurn, setCheckmateTurn] = useState("w");
  const [intervalId, setIntervalId] = useState(null);
  const [playersJoined, setPlayersJoined] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // end ref
  const chatEndRef = useRef(null);

  // when recieve message is listed by the client side code
  useEffect(() => {
    // socket to listen
    socket.on("receiveMessage", (message) => {
      // set the chat messages 
      // an array of all messages
      setChatMessages((prevMessages) => [
        ...prevMessages, // copy all previous messages
        { ...message, type: "received" } // make their type to recieved to style them correctly
      ]);
      scrollToBottom(); // scroll to bottom function
    });
    

    return () => {
      socket.off("receiveMessage"); // remove the socket listener once component unmounts
    };
  }, []);



  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); // assigned it to a div below chat message to scroll to it or make it viewable
  };



  useEffect(() => {
    socket.on("error", ({ message }) => {
        setStatusMessage(message);
        setGameStarted(false);
        stopTimer();
    });
    return () => {
        socket.off("error");
    };
}, []);



  useEffect(() => {

    // on listening to player joined event form server set player has joined to created user
    socket.on("playerJoined", () => {
      setPlayersJoined(true);
    });


    // on both players joined set players joined to true for the joined user
    socket.on("bothPlayersJoined", () => {
      setPlayersJoined(true);
      setStatusMessage("Both players joined. You can start the game now.");
    });

    // on gamestate return update the client side game state
    socket.on("gameState", ({ fen, turn }) => {
      setGame(new Chess(fen));
      setPosition(fen);
      setTurn(turn); 
      updateGameStatus();
    });


    // on start game event from the server start he game for the other user
    socket.on("startGame", () => {
      startGame();
    });


    // game over event
    socket.on("gameOver", ({ message, winnerId, loserId }) => {
      handleGameOver(message, winnerId, loserId);
    });

    return () => {
      socket.off("playerJoined");
      socket.off("bothPlayersJoined");
      socket.off("gameState");
      socket.off("startGame");
      socket.off("gameOver");
    };
  }, [roomId, game, color]);


  // timer logic
  useEffect(() => { if (gameStarted) { startTimer(); } else { stopTimer(); } return () => stopTimer(); }, [turn, gameStarted]);


  // square click handling
  function handleSquareClick(square) {
    if (!gameStarted) return;
  

    // if selected square and the legal move of the piece match make the move
    if (selectedSquare && highlightSquares[square]) {
      const piece = game.get(selectedSquare);
      if (piece && piece.color === color[0]) {
        const move = game.move({ from: selectedSquare, to: square });
        if (move) {
          // emit piece movement event to the server
          socket.emit("pieceMove", {
            from: selectedSquare,
            to: square,
            roomId,
          });

          // set game state to the movement
          setPosition(game.fen());
          // reset the selected square to null 
          setSelectedSquare(null);
          // highlight none normalize the styles
          setHighlightSquares({});
          // set game turn
          setTurn(game.turn()); 
          // update game status
          updateGameStatus(); 
          
          // if chechmate handle it
          if (game.isCheckmate()) {
            setCheckmateTurn(piece.color); 
          }
        }
      } else {
        alert("You can only move your own pieces!");
      }
    } else {

      // if piece square is selsected highlight all the moves of it
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
        setHighlightSquares({});
        setSelectedSquare(null);
      }
    }
  }


  // get legal moves
  function getLegalMoves(square) {
    return game.moves({ square, verbose: true });
  }

  function updateGameStatus() {
    const currentTurn = game.turn();
    if (game.isCheckmate()) {
      handleGameOver("Checkmate! Game Over.");
    } else if (game.isDraw()) {
      handleGameOver("It's a draw!");
    } else if (game.isCheck()) {
      setStatusMessage("Check!");
    } else if (game.isGameOver()) {
      handleGameOver("Game Over!");
    } else {
      setStatusMessage("");
    }
  }

  async function handleGameOver(message) {
    try {
      const winnerColor = checkmateTurn; 
      const loserColor = winnerColor === "w" ? "b" : "w"; 

      setStatusMessage(`${winnerColor === "w" ? "White" : "Black"} wins!`);
      setGameStarted(false);
      stopTimer();
      socket.emit("gameOver", {
        roomId,
        message,
        winnerRole: winnerColor,
        loserRole: loserColor,
      });
    } catch (error) {
      console.error("Error handling game over:", error);
    }
  }

  // start game button
  function startGame() {
    // new game instance
    setGame(new Chess()); 
    // set fen of the new game
    setPosition(game.fen());
    // set game started to true
    setGameStarted(true);
    // status message
    setStatusMessage("Game Started. White to move!");

    // duration
    setWhiteTime(gameDuration * 60);
    setBlackTime(gameDuration * 60); 
    // turn
    setTurn("w"); 
    setCheckmateTurn("w"); 

    startTimer(); 
  }


  // timer start 
  function startTimer() {
    stopTimer();  
    const id = setInterval(() => {
        if (turn === "w") {

           // if turn is whites decrement its timer
            setWhiteTime((prevTime) => {
                if (prevTime <= 0) {
                    handleTimeOver("White's time is up! Black wins!", "b", "w");
                    return 0;
                }
                return prevTime - 1;
            });
        } else {
          // if blacks turn 
            setBlackTime((prevTime) => {
                if (prevTime <= 0) {
                    handleTimeOver("Black's time is up! White wins!", "w", "b");
                    return 0;
                }
                return prevTime - 1;
            });
        }
    }, 1000);
    setIntervalId(id);
}



// time over logic
async function handleTimeOver(message, winnerRole, loserRole) {
    try {
        setStatusMessage(message); // notify the user
        setGameStarted(false); // stop the game
        stopTimer(); // stop the timer
        socket.emit("gameOver", { // emit to the server who won to update the db
            roomId,
            message,
            winnerRole,
            loserRole,
        });
    } catch (error) {
        console.error("Error handling time over:", error);
    }
}


// stop timer funciton which uses set interval to handling stopping and starting of timer
function stopTimer() {
    if (intervalId) {
      // clear the interval to stop
        clearInterval(intervalId);
        // set it to null (optional)
        setIntervalId(null);
    }
}


  
  // format time to minutes and seconds
  function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }


  // surrender handling
  function handleSurrender() {
    const currentColor = color === "white" ? "w" : "b"; // 'color' is your player's color
    const winnerColor = currentColor === "w" ? "b" : "w"; // The winner is the opponent

    setStatusMessage(
      `${winnerColor === "w" ? "White" : "Black"} wins by surrender!`
    );
    setGameStarted(false);
    stopTimer();
    socket.emit("surrender", { roomId, winnerRole: winnerColor }); // Emitting the winner's role
  }

  // start game emit to the server 
  function handleStartGame() {
    socket.emit("startGame", { roomId });
  }




  // chat section code

  function handleChatInputChange(event) {
    setChatInput(event.target.value);
  }

  function handleSendMessage() {
    if (chatInput.trim()) {
      const message = { content: chatInput.trim(), type: "sent" };
      // emit send message event to the server which listens for it and responds
      socket.emit("sendMessage", { roomId, message });
      setChatMessages((prevMessages) => [...prevMessages, message]);
      setChatInput("");
      // scroll to the user ref div i.e botton of the chat
      scrollToBottom();
    }
  }
  


  // board component 
  return (
    <div className="app-container">
      <div className="game-status">
        <h3>Room ID: {roomId || "N/A"}</h3> {/* room id to share to */}
        <p>Share this Room ID with a friend to join.</p>
        <p>{statusMessage}</p>
      </div>
      {/* Black Player Section */}
      <div className="user-section">
        <h2>
          {color === "white"
            ? "Black Player (Opponent)"
            : "White Player (Opponent)"}
        </h2>
        <p className="timer">
          Time: {formatTime(color === "white" ? blackTime : whiteTime)}
        </p>
      </div>
      {/* Chessboard Display */}
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
      {/* Bottom Player Section */}
      <div className="user-section">
        <h2>
          {color === "white" ? "White Player (You)" : "Black Player (You)"}
        </h2>
        <p className="timer">
          Time: {formatTime(color === "white" ? whiteTime : blackTime)}
        </p>
      </div>
      {/* Start and Surrender Buttons */}
      <div className="start-btn-container">
        {!playersJoined && (
          <button className="start-btn disabled" disabled>
            Start Game
          </button>
        )}
        {/* Real Start Button */}
        {!gameStarted && playersJoined && (
          <button className="start-btn" onClick={handleStartGame}>
            Start Game
          </button>
        )}
        {/* Surrender Button */}
        {gameStarted && (
          <button className="surrender-btn" onClick={handleSurrender}>
            Surrender
          </button>
        )}
      </div>
      {/* Chat Section */}
      <div className="chat-container">
      <div className="chat-messages">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.type === "sent" ? "sent" : "received"}`}
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
