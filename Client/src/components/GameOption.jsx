import React from "react";
import "../styles/GameOption.css";

const GameOption = (props) => {
  // destructuring the props 
  const { title, description, buttonText, onClick } = props;

  return (
    // game box component to use for multiple game types in the home page
    <div className="game-box">
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="game-btn" onClick={onClick}>
        {buttonText}
      </button>
    </div>
  );
};

export default GameOption;
