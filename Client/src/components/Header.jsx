// header styles 

// imports 
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "../styles/Header.css";



const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    // removing token from the lacal storage
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    // relaod the page once sign out is clicked to reflect the change 
    window.location.reload(); 
  };


  // header component

  return (
    <header className="header">
      <div className="logo">
        <img src="/assets/logo.png" alt="Website Logo" className="logo-img" />
        <h1 className="site-name">R.R Chess.io</h1>
      </div>
      <div className="profile">
        <button
          className="profile-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)} 
        >
          Profile ▼
        </button>
        {dropdownOpen && (
          <div className="dropdown">
            <a href="/Profile" class="profile-btnview">View Profile</a>
            <button class="signout" onClick={handleSignOut}>Sign Out</button>

          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
