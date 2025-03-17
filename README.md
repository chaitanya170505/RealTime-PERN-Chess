# Real-Time Multiplayer Chess using PERN Stack ♟️

A full-stack real-time chess platform built with the **PERN stack (PostgreSQL, Express.js, React.js, Node.js)**, integrating **Stockfish AI**, **Socket.io** for real-time gameplay and chat, and **JWT-based authentication**.

---

## 🚀 Features

- 🔴 Real-Time Multiplayer Chess using **Socket.io**
- 🤖 **Play against AI** with integrated **Stockfish Chess Engine**
- 🔀 **Random Matchmaking Queue** for fair anonymous play
- 👫 **Play with Friends** via private room links
- 💬 **In-game Chat System** for live communication
- 🔐 **JWT Authentication & bcrypt-secured login**
- 🗃️ **User History & Game Records** stored in **PostgreSQL**
- 📱 **Responsive UI** using **React.js** and **React Chessboard**
- ☁️ **Scalable Deployment** on platforms like **Render, Vercel, or AWS**

---

## 🧠 Tech Stack

### Frontend:
- React.js
- React Chessboard
- Chess.js
- Socket.io (Client)

### Backend:
- Node.js
- Express.js
- Socket.io (Server)
- Stockfish (Chess AI Engine)

### Database:
- PostgreSQL

### Authentication & Security:
- JWT (JSON Web Token)
- bcrypt.js (Password Hashing)

---

## 🔧 Installation Guide

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/your-username/real-time-chess-app.git


## 📦 Install Dependencies

### 🔹 Frontend (React with Vite)
```bash
cd client
npm install
```

### 🔹 Backend (Node.js + Express)
```bash
cd ../server
npm install
```

## 🔐 Set Up Environment Variables

In the `/server` directory, create a `.env` file and add your environment variables:

```env
DB_USER=your_db_username  
DB_PASSWORD=your_db_password  
DB_NAME=your_db_name  
SESSION_SECRET=your_session_secret
```

## 🚀 Run the Application

### ▶️ Start Frontend (Vite Dev Server)
```bash
cd client
npm run dev
```

### ▶️ Start Backend (Express Server)
```bash
cd ../server
node index.js
```

## 🌐 Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)  
- **Backend API**: [http://localhost:5000](http://localhost:5000) 



---

## 🔮 Future Scope

- 🧑‍🤝‍🧑 **WebRTC-based Video Chat** for a social experience like Omegle  
- 🤖 **AI Chatbot for Chess FAQs and Tips**  
- ☁️ **Cloud-based scaling and tournament systems**

---

## 🌐 Real-World Impact

- Enhancing online chess experience with **simple, real-time, and secure gameplay**
- Demonstrates **real-world application of Socket.io and AI**
- Useful for **educational and recreational chess learning**

---

## 📜 License

This project is open-source and available under the MIT License.

---

## 🙌 Contributions

Feel free to fork, improve, and suggest new features. Pull requests are welcome!



