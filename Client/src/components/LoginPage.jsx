// lagin page component 

// imports
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import "../styles/Login.css"; 


// switch from login to register and vice versa
const LoginPage = ({ onSwitch, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });
      const token = res.data.token;
      
      // save token to the local storage after submit
      localStorage.setItem("token", token);
      
      // storing username too
      localStorage.setItem("username", res.data.username);
      
      // Calling onLogin if it's needed for other state management in the parent component
      onLogin(token);

      // navigating to the home page after successful login
      navigate("/"); 
    } catch (error) {
      console.error("Login error", error);
      alert("Invalid credentials");
    }
  };
  

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        No account?{" "}
        <span className="switch-link" onClick={onSwitch}>
          Register here
        </span>
      </p>
    </div>
  );
};

export default LoginPage;
