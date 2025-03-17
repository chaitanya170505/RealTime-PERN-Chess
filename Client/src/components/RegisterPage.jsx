// register page code

// imports
import { useState } from "react";
import axios from "axios";
import "../styles/Login.css"; 


  // use state for register page terms like username, password, email
  const RegisterPage = () => {
    const [formData, setFormData] = useState({
      username: "",
      email: "",
      password: "",
  });


  // handle change and update register page terms
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // finally on submit api call to backed to store in db
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/register", formData);
      console.log("Registration successful:", res.data);
      

      alert("Registration successful!");

      
      window.location.reload();
    } catch (error) {
      console.error("Registration error:", error.response ? error.response.data : error.message);
    }
  };


  // regiter component
  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegisterPage;
