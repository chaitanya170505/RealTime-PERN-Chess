const client = require('./db'); 

// Function to update win count
async function updateWinCount(username) {
  try {
    const query = 'UPDATE users SET wins = wins + 1 WHERE username = $1';
    await client.query(query, [username]);
    console.log('Win count updated for user:', username);
  } catch (error) {
    console.error('Error updating win count:', error);
  }
}

// Function to update loss count
async function updateLossCount(username) {
  try {
    const query = 'UPDATE users SET losses = losses + 1 WHERE username = $1';
    await client.query(query, [username]);
    console.log('Loss count updated for user:', username);
  } catch (error) {
    console.error('Error updating loss count:', error);
  }
}

// Function to update draw count
async function updateDrawCount(username) {
  try {
    const query = 'UPDATE users SET draws = draws + 1 WHERE username = $1';
    await client.query(query, [username]);
    console.log('Draw count updated for user:', username);
  } catch (error) {
    console.error('Error updating draw count:', error);
  }
}

module.exports = { updateWinCount, updateLossCount, updateDrawCount };
