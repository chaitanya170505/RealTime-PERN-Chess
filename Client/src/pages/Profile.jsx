import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header.jsx";
import "../styles/Profile.css";
import Footer from "../components/Footer.jsx";

const UserProfile = () => {


  const storedUsername = localStorage.getItem("username");
  const token = localStorage.getItem("token"); 
  const [profileData, setProfileData] = useState(null);

  // variable to store wins against players
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);

  // variables to store results against bot
  const [botWins, setBotWins] = useState(0); 
  const [botLosses, setBotLosses] = useState(0); 
  const [botDraws, setBotDraws] = useState(0);  

  const [editUsername, setEditUsername] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // fetching user data from server
  useEffect(() => {
    if (storedUsername) {
      axios
        .get(`http://localhost:5000/user/${storedUsername}`, {
          headers: {
            Authorization: `Bearer ${token}`, // token based authentication
          },
        })
        .then((response) => {
          setProfileData(response.data);

          setWins(response.data.wins); 
          setLosses(response.data.losses);
          setDraws(response.data.draws);

          setBotWins(response.data.botwins);  
          setBotLosses(response.data.botlosses);  
          setBotDraws(response.data.botdraws); 
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          if (error.response?.status === 401) {
            alert("Unauthorized. Please log in again.");
          }
        });
    }
  }, [storedUsername, token]);

  // update username
  const handleUsernameSave = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/user/${profileData.id}/update-username`,
        { username: newUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        }
      );
      localStorage.setItem("username", newUsername);
      setProfileData((prev) => ({ ...prev, username: newUsername }));
      setEditUsername(false);
    } catch (error) {
      console.error("Error updating username:", error);
      alert(error.response?.data?.message || "Username update failed.");
    }
  };


  // update password
  const handlePasswordSave = async () => {
    try {
      await axios.put(
        `http://localhost:5000/user/${profileData.id}/update-password`,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        }
      );
      alert("Password updated successfully!");
      setEditPassword(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      alert(error.response?.data?.message || "Password update failed.");
    }
  };

  if (!profileData) return <p>Loading profile...</p>;

  return (
    <div>
      <Header />
      <div className="profile-container">
        <div className="profile-card">
          {/* Profile Picture */}
          <div className="profile-pic-container">
            <img
              src={profileData.profilePic || "/assets/profile.png"}
              alt="Profile"
              className="profile-pic"
            />
          </div>

          {/* Username */}
          {editUsername ? (
            <>
              <input
                type="text"
                className="edit-input"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <button className="save-btn" onClick={handleUsernameSave}>
                Save
              </button>
            </>
          ) : (
            <>
              <h2 className="username">{profileData.username}</h2>
              <button className="edit-btn" onClick={() => setEditUsername(true)}>
                Edit Username
              </button>
            </>
          )}

          {/* Password Section */}
          {editPassword ? (
            <>
              <input
                type="password"
                className="edit-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
              />
              <input
                type="password"
                className="edit-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
              />
              <button className="save-btn" onClick={handlePasswordSave}>
                Save
              </button>
            </>
          ) : (
            <button className="edit-btn" onClick={() => setEditPassword(true)}>
              Edit Password
            </button>
          )}

          {/* Player Stats Section */}
          <div className="stats-container">
            <h3>Stats Against Players</h3>
            <div className="stat">
              <span className="stat-number">{wins}</span>
              <span className="stat-label">Wins</span>
            </div>
            <div className="stat">
              <span className="stat-number">{losses}</span>
              <span className="stat-label">Losses</span>
            </div>
            <div className="stat">
              <span className="stat-number">{draws}</span>
              <span className="stat-label">Draws</span>
            </div>
          </div>

          {/* Bot Stats Section */}
          <div className="bot-stats-container">
            <h3>Stats Against Bot</h3>
            <div className="stat">
              <span className="stat-number">{botWins}</span>
              <span className="stat-label">Wins</span>
            </div>
            <div className="stat">
              <span className="stat-number">{botLosses}</span>
              <span className="stat-label">Losses</span>
            </div>
            <div className="stat">
              <span className="stat-number">{botDraws}</span>
              <span className="stat-label">Draws</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserProfile;
