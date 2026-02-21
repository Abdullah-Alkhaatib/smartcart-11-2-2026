import React from "react";
import "./nana.css";

export default function Nana() {
  return (
    <div className="nana-container">
      {/* Falling Petals */}
      <div className="petals">
        {[...Array(15)].map((_, i) => (
          <span
            key={i}
            className="petal"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          ></span>
        ))}
      </div>

      {/* Roses Around */}
      <div className="roses-container">
        <div className="rose rose-1">🌹</div>
        <div className="rose rose-2">🌹</div>
        <div className="rose rose-3">🌹</div>
        <div className="rose rose-4">🌹</div>
        <div className="rose rose-5">🌹</div>
        <div className="rose rose-6">🌹</div>
      </div>

      {/* Butterflies */}
      <div className="butterflies">
        <div className="butterfly butterfly-1">🦋</div>
        <div className="butterfly butterfly-2">🦋</div>
        <div className="butterfly butterfly-3">🦋</div>
        <div className="butterfly butterfly-4">🦋</div>
      </div>

      {/* Stars */}
      <div className="stars">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            ⭐
          </div>
        ))}
      </div>

      {/* Glowing Hearts */}
      <div className="glowing-hearts">
        <div className="growing-heart heart-1">💕</div>
        <div className="growing-heart heart-2">💕</div>
        <div className="growing-heart heart-3">💕</div>
      </div>

      {/* Flying N Letters */}
      <div className="flying-letters">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flying-n"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          >
            N
          </div>
        ))}
      </div>

      <div className="heart-wrapper">
        <div className="heart">
          <div className="heart-text">Nana</div>
        </div>
        <div className="sparkles">
          <span className="sparkle">✨</span>
          <span className="sparkle">✨</span>
          <span className="sparkle">✨</span>
          <span className="sparkle">💫</span>
          <span className="sparkle">💫</span>
          <span className="sparkle">✨</span>
        </div>
      </div>

      <h1 className="nana-title">Made with Love ❤️</h1>
      <p className="nana-subtitle">Forever & Always✨</p>
    </div>
  );
}
