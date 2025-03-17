// socket code to handshake with the backend 
import io from "socket.io-client";


// link to the server to handshake with
// just one instance of socket is used for all the games
const socket = io("http://localhost:5000");

export default socket;
