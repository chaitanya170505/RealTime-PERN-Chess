const socketIo = require("socket.io");
const { Chess } = require("chess.js");
const { v4: uuidv4 } = require("uuid"); 
const {
  updateWinCount,
  updateLossCount,
  updateDrawCount,
} = require("./resultFunctions.js");

const games = {}; // storing game instances and player roles

let queue = []; // queue to add players for random match

const randomGames={}; 

const getRandomSide = () => (Math.random() < 0.5 ? "white" : "black"); // random side choosing 



module.exports = (server) => {

  // cors for permisison 
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000", // Frontend URL
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });



  // if client gets connected
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Create a new game evet from the client
    socket.on("createGame", ({ gameDuration, color, username }, callback) => {

      // room id creation some random login found in internet
      const roomId = `room_${Math.random().toString(36).slice(2, 11)}`;

      // new chess game instance for creation
      const chessGame = new Chess();
      const playerColor = color.toLowerCase();


      // stoing all the details in the game array as object
      games[roomId] = {
        chess: chessGame,
        gameDuration,
        players: {
          [playerColor]: { username, socketId: socket.id },
          [playerColor === "white" ? "black" : "white"]: null, 
        },
        playerCount: 1, 
      };


      // join the palyer the room id
      socket.join(roomId);
      console.log(
        `Game created: Room ID ${roomId}, Duration ${gameDuration}, Creator plays ${color}`
      );

      // call back function to the clinet side to display room id and all
      if (callback) {
        callback({
          success: true,
          roomId,
          gameState: chessGame.fen(),
          role: playerColor,
          gameDuration,
          username,
        });
      }
    });


    // game over logic
    function handleGameOver(
      roomId,
      message,
      winnerUsername = null,
      loserUsername = null,
      result = "win"
    ) {
      if (result === "win" && winnerUsername && loserUsername) {
        updateWinCount(winnerUsername);
        updateLossCount(loserUsername);
      } else if (result === "draw" && winnerUsername && loserUsername) {
        updateDrawCount(winnerUsername);
        updateDrawCount(loserUsername);
      }

      // Notify both players if they exist
      if (games[roomId]) {
        io.to(roomId).emit("gameOver", {
          message,
          winnerUsername,
          loserUsername,
          result,
        });
        delete games[roomId]; // Clean up game state after it's over
      }
    }



    // Join an existing game
    socket.on("joinGame", ({ roomId, username }, callback) => {
      const game = games[roomId];

      if (!game) {
        return (
          callback && callback({ success: false, message: "Game not found!" })
        );
      }


      // don't allow if player count is grater than 2
      if (game.playerCount >= 2) {
        return (
          callback &&
          callback({ success: false, message: "Game is already full!" })
        );
      }


      // alot the remaining role the joiner
      const availableRole = Object.keys(game.players).find(
        (role) => game.players[role] === null
      );

      // no available role for the user thna throw error
      if (!availableRole) {
        return (
          callback &&
          callback({ success: false, message: "Game is already full!" })
        );
      }


      // update the game array with joiner id and all
      game.players[availableRole] = { username, socketId: socket.id };
      game.playerCount++;
      socket.join(roomId);

      console.log(
        `Player ${username} joined Room ID: ${roomId} as ${availableRole}`
      );


      // call back to the joiner the room id and all
      if (callback) {
        callback({
          success: true,
          roomId,
          gameState: game.chess.fen(),
          role: availableRole,
          gameDuration: game.gameDuration,
          username,
        });
      }



      // Notify opponent that both players are ready
      if (game.playerCount === 2) {
        io.to(roomId).emit("bothPlayersJoined", {
          message: "Both players are ready!",
        });
      }
    });



    // Handle piece movement with role validation
    socket.on("pieceMove", ({ from, to, roomId }, callback) => {
      const game = games[roomId];

      if (!game) {
        return (
          callback && callback({ success: false, message: "Game not found!" })
        );
      }

      const playerRole = Object.keys(game.players).find(
        (role) => game.players[role]?.socketId === socket.id
      );
      if (!playerRole) {
        return (
          callback &&
          callback({
            success: false,
            message: "You are not part of this game!",
          })
        );
      }

      const piece = game.chess.get(from);
      if (!piece || piece.color !== playerRole[0]) {
        return (
          callback &&
          callback({
            success: false,
            message: "You can only move your own pieces!",
          })
        );
      }

      const move = game.chess.move({ from, to });
      if (move) {
        const turn = game.chess.turn(); // Get the current turn
        io.to(roomId).emit("gameState", { fen: game.chess.fen(), turn }); // Emit the FEN and turn state
        return (
          callback &&
          callback({ success: true, newGameState: game.chess.fen() })
        );
      } else {
        return (
          callback && callback({ success: false, message: "Invalid move!" })
        );
      }
    });

    // Handle surrender event
    socket.on("surrender", ({ roomId, winnerRole }) => {
      const game = games[roomId];

      if (game) {
        const winnerUsername =
          game.players[winnerRole === "w" ? "white" : "black"]?.username;
        const loserUsername =
          game.players[winnerRole === "w" ? "black" : "white"]?.username;

        handleGameOver(
          roomId,
          `${winnerUsername} wins by surrender!`,
          winnerUsername,
          loserUsername,
          "win"
        );

        delete games[roomId]; // Properly remove the game
      }
    });

    // Handle start game event
    socket.on("startGame", ({ roomId }) => {
      console.log(`Game started in Room ID: ${roomId}`);
      io.to(roomId).emit("startGame");
    });


    // communication logic for the chat
    socket.on("sendMessage", ({ roomId, message }) => {
      if (games[roomId]) {
        // Emit the message to everyone in the room except the sender
        socket.to(roomId).emit("receiveMessage", message);
      }
    });



    // Handle disconnects
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);

      Object.keys(games).forEach((roomId) => {
        const game = games[roomId];
        const playerColor = Object.keys(game.players).find(
          (color) => game.players[color]?.socketId === socket.id
        );
        if (playerColor) {
          io.to(roomId).emit("error", {
            message: `${game.players[playerColor]?.username} disconnected!`,
          });
          delete games[roomId];
          console.log(`Game ${roomId} removed due to disconnection.`);
        }
      });
    });



    
    // game oer logic
    socket.on("gameOver", ({ roomId, message, winnerRole }) => {
      const game = games[roomId];

      if (game) {
        const winnerUsername =
          game.players[winnerRole === "w" ? "white" : "black"]?.username;
        const loserRole = winnerRole === "w" ? "b" : "w"; // The opposite of the winner
        const loserUsername =
          game.players[loserRole === "w" ? "white" : "black"]?.username;

        // Call handleGameOver with roles and update the message accordingly
        handleGameOver(
          roomId,
          `${winnerRole === "w" ? "White" : "Black"} wins! ${message}`,
          winnerUsername,
          loserUsername,
          "win"
        );

        delete games[roomId]; // Properly remove the game after game over
      }
    });








    // play ranom event
    socket.on("play_random", ({ username }) => {


      // push them into the queue
      console.log(username);
      queue.push({ socket, username });
    

      // if atleat 2 players are present in the queue pop them out
      // socket instance along wiht username
      if (queue.length >= 2) {
        const player1 = queue.shift(); // pop()
        const player2 = queue.shift(); // pop()
    
        // check whether they are still connected
        if (!player1.socket.connected || !player2.socket.connected) {
          // Ensure both players are still connected
          if (player1.socket.connected) queue.unshift(player1);
          if (player2.socket.connected) queue.unshift(player2);
          return;
        }
    

        // align their opponets in the socket array
        player1.socket.opponent = player2.socket;
        player2.socket.opponent = player1.socket;
    
        // side seleciton for them 
        const player1Side = getRandomSide();
        const player2Side = player1Side === "white" ? "black" : "white";
        const roomId = uuidv4(); // room id generation
    
        // Join both of them into a room 
        player1.socket.join(roomId);
        player2.socket.join(roomId);
    
        randomGames[roomId] = {
          chess: new Chess(),
          players: {
            white: {
              socketId: player1Side === "white" ? player1.socket.id : player2.socket.id,
              username: player1Side === "white" ? player1.username : player2.username
            },
            black: {
              socketId: player1Side === "black" ? player1.socket.id : player2.socket.id,
              username: player1Side === "black" ? player1.username : player2.username
            }
          }
        };
    

        // mathc found event for both users
        player1.socket.emit("match_found", {
          opponentUsername: player2.username,
          side: player1Side,
          roomId: roomId,
        });
        player2.socket.emit("match_found", {
          opponentUsername: player1.username,
          side: player2Side,
          roomId: roomId,
        });


      }
    });
    


    // cancel searhc from the client which rethrows the user into the queue
    socket.on("cancel_search", () => {
      const index = queue.findIndex((entry) => entry.socket === socket);
      if (index !== -1) queue.splice(index, 1);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      if (socket.opponent) {
        socket.opponent.emit("opponent_left");
        socket.opponent.opponent = null; // Clean up reference
      }

      const index = queue.findIndex((entry) => entry.socket === socket);
      if (index !== -1) queue.splice(index, 1);
    });



    // random game over logic
    function handleRandomGameOver(
        roomId,
        message,
        winnerUsername = null,
        loserUsername = null,
        result = "win"
      ) {
        if (result === "win" && winnerUsername && loserUsername) {
          updateWinCount(winnerUsername);
          updateLossCount(loserUsername);
        } else if (result === "draw" && winnerUsername && loserUsername) {
          updateDrawCount(winnerUsername);
          updateDrawCount(loserUsername);
        }
  
        // Notify both players if they exist
        if (randomGames[roomId]) {
          io.to(roomId).emit("randomGameOver", {
            message,
            winnerUsername,
            loserUsername,
            result,
          });
          delete randomGames[roomId]; // Clean up game state after it's over
        }
      }



      // Random piece move logic which is similar to piece move
      socket.on("randomPieceMove", ({ from, to, roomId }, callback) => {
        const game = randomGames[roomId];
  
        if (!game) {
          return (
            callback && callback({ success: false, message: "Game not found!" })
          );
        }
  
        const playerRole = Object.keys(game.players).find(
          (role) => game.players[role]?.socketId === socket.id
        );
        if (!playerRole) {
          return (
            callback &&
            callback({
              success: false,
              message: "You are not part of this game!",
            })
          );
        }
  
        const piece = game.chess.get(from);
        if (!piece || piece.color !== playerRole[0]) {
          return (
            callback &&
            callback({
              success: false,
              message: "You can only move your own pieces!",
            })
          );
        }
  
        const move = game.chess.move({ from, to });
        if (move) {
          const turn = game.chess.turn(); // Get the current turn
          io.to(roomId).emit("gameState", { fen: game.chess.fen(), turn }); // Emit the FEN and turn state
          console.log("fine");
          return (
            callback &&
            callback({ success: true, newGameState: game.chess.fen() })
          );
        } else {
          return (
            callback && callback({ success: false, message: "Invalid move!" })
          );
        }
      });
  
      // similar to surrender 
      // Handle surrender event for random games
      socket.on("randomSurrender", ({ roomId, winnerRole }) => {
        const game = randomGames[roomId];
  
        if (game) {
          const winnerUsername =
            game.players[winnerRole === "w" ? "white" : "black"]?.username;
          const loserUsername =
            game.players[winnerRole === "w" ? "black" : "white"]?.username;
  
          handleRandomGameOver(
            roomId,
            `${winnerUsername} wins by surrender!`,
            winnerUsername,
            loserUsername,
            "win",
            true
          );
  
          delete randomGames[roomId]; // Properly remove the game
        }
      });
  

      // similar to start game 
      // Handle start game event for random games
      socket.on("randomStartGame", ({ roomId }) => {
        console.log(`Game started in Room ID: ${roomId}`);
        io.to(roomId).emit("startGame");
      });
  

      // similar to send message
      // Handle sendMessage event for random games
      socket.on("randomSendMessage", ({ roomId, message }) => {
        if (randomGames[roomId]) {
          // Emiting messsage to the room 
          socket.to(roomId).emit("receiveMessage", message);
        }
      });



      // similar to game over 
      socket.on("randomGameOver", ({ roomId, message, winnerRole }) => {
        const game = randomGames[roomId];
  
        if (game) {
          const winnerUsername =
            game.players[winnerRole === "w" ? "white" : "black"]?.username;
          const loserRole = winnerRole === "w" ? "b" : "w"; // The opposite of the winner
          const loserUsername =
            game.players[loserRole === "w" ? "white" : "black"]?.username;
  
          // Call handleRandomGameOver with roles and update the message accordingly
          handleRandomGameOver(
            roomId,
            `${winnerRole === "w" ? "White" : "Black"} wins! ${message}`,
            winnerUsername,
            loserUsername,
            "win"
          );
  
          delete randomGames[roomId]; // Properly remove the game after game over
        }
      });


  });
};
