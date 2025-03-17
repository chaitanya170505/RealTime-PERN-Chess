const express = require("express");
const router = express.Router();
const pool = require("./db");
const bcrypt = require("bcrypt");

// Get user details
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    
    // Updated query to fetch wins, losses, draws, botWins, botLosses, and botDraws along with user details
    const result = await pool.query(
      "SELECT id, username, wins, losses, draws, botWins, botLosses, botDraws FROM users WHERE username = $1",
      [username]
    );
    
    if (result.rows.length > 0) {
      // Sending response along with result details
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});



// update username route
router.put("/user/:id/update-username", async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    const checkUser = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: "Username already taken" });
    }

    await pool.query("UPDATE users SET username = $1 WHERE id = $2", [username, id]);
    res.json({ message: "Username updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});



// Update password route
router.put("/user/:id/update-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await pool.query("SELECT password FROM users WHERE id = $1", [id]);
    if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ message: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// Player id retireval route
router.get('/api/getPlayerIds', (req, res) => {
  const roomId = req.query.roomId;
  const game = games[roomId];
  
  if (!game) {
    return res.status(404).send({ message: "Game not found!" });
  }

  const playerNames = {
    white: game.players.white?.username, // Access the username of the white player
    black: game.players.black?.username // Access the username of the black player
  };

  res.send(playerNames);
});


// game result updation route for bot play
router.post('/api/ai-game-result', async (req, res) => {
  const { username, result } = req.body;

  console.log('Received:', { username, result }); // Debugging log

  try {
    let query = '';
    if (result === 'win') {
      query = 'UPDATE users SET botwins = botwins + 1 WHERE username = $1';
    } else if (result === 'loss') {
      query = 'UPDATE users SET botlosses = botlosses + 1 WHERE username = $1';
    } else if (result === 'draw') {
      query = 'UPDATE users SET botdraws = botdraws + 1 WHERE username = $1';
    } else {
      return res.status(400).send('Invalid result value');
    }

    const { rowCount } = await pool.query(query, [username]);

    if (rowCount === 0) {
      return res.status(404).send('User not found');
    }

    res.status(200).send('Game result updated successfully');
  } catch (err) {
    console.error('Error updating game result:', err);
    res.status(500).send('Internal server error');
  }
});



module.exports = router;
