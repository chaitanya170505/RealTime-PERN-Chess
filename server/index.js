const express = require('express');
const cors = require('cors');
const http = require('http');
const authRoutes = require('./auth');
const initializeSocket = require('./socket'); 
const user = require('./user');


// create a http server initially and add socket layer to that http server
const app = express();
const server = http.createServer(app);



// Middleware
app.use(express.json());
app.use(cors()); // to allow access for inter website communication



// Routes
app.get('/', (req, res) => {
    res.send("hi bro");
});

app.use('/', authRoutes);
app.use('/', user);

// Initialize Socket.IO with the server
initializeSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
