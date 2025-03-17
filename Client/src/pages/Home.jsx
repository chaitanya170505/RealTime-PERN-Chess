import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import Header from "../components/Header.jsx";
import GameOption from "../components/GameOption.jsx";
import "../styles/Home.css";
import socket from "../components/socket.jsx";
import Footer from "../components/Footer.jsx";

const Home = () => {
  const [searching, setSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [color, setColor] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();



  const getUsernameFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username;
    } catch (error) {
      console.error("Invalid token", error);
      return null;
    }
  };


  // handling random geme button 
  useEffect(() => {
    socket.on("match_found", ({ opponentUsername, side, roomId }) => { // if match is found return the username, side
      setSearching(false); // stop searching 
      setMatchFound(true); 
      setOpponent(opponentUsername);
      setColor(side);

      let counter = 5; // count to start the game
      setCountdown(counter);


      // decrement the count before start of the match 
      const countdownInterval = setInterval(() => {
        counter -= 1;
        setCountdown(counter);

        if (counter === 0) {
          clearInterval(countdownInterval);
          navigate(`/Play-Random?roomId=${roomId}&color=${side}&opponent=${opponentUsername}`);
        }
      }, 1000);
    });



    // handling opponent left case before match startted 
    socket.on("opponent_left", () => {
      setMatchFound(false);
      setSearching(true);
      socket.emit("play_random", { username: getUsernameFromToken() });
    });

    return () => {
      socket.off("match_found");
      socket.off("opponent_left");
    };
  }, [navigate]);



  // emit play rondom event from the user side to the client side 
  // used to add them to a queue
  const handlePlayRandom = () => {
    setSearching(true);
    socket.emit("play_random", { username: getUsernameFromToken() });
  };


  // cancel the search 
  const handleCancelSearch = () => {
    setSearching(false);
    socket.emit("cancel_search", { username: getUsernameFromToken() });
  };






  return (
    <div>
      <Header />
      <hr />
      <div className="home-container">
        <GameOption
          title="Play Online"
          description="Compete against your friends by creating a private room or joining an existing one."
          buttonText="Start Playing"
          onClick={() => navigate("/PlayOnline")}
        />
        <GameOption
          title="Play with AI"
          description="Sharpen your skills by facing AI opponents with adjustable difficulty settings."
          buttonText="Challenge AI"
          onClick={() => navigate("/PlayBotOptions")}
        />
        {searching ? (
          <GameOption
            title={
              <span>
                Searching for a Match... <ClipLoader color="#000000" size={15} />
              </span>
            }
            description="Please wait while we find an opponent."
            buttonText="Cancel Search"
            onClick={handleCancelSearch}
          />
        ) : matchFound ? (
          <GameOption
          title={
            <span>
              Match Found! <ClipLoader color="#000000" size={15} />
            </span>
          }
          description={`You are playing against ${opponent}. Starting in ${countdown} seconds...`}
          buttonText={`Starting in ${countdown}s...`}
          buttonDisabled={true}
        />
        ) : (
          <GameOption
            title="Play Randomly"
            description="Join a game instantly and compete against random players online."
            buttonText="Find a Match"
            onClick={handlePlayRandom}
          />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Home;
