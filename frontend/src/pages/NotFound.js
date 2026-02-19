import React from 'react';
import { Link } from 'react-router-dom';
import './notFound.css';

const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">الصفحة غير موجودة</h1>
        <p className="notfound-description">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم حذفها.
        </p>
        <div className="notfound-illustration">
          <svg
            viewBox="0 0 400 300"
            className="notfound-svg"
          >
            <circle cx="200" cy="100" r="50" fill="#e74c3c" opacity="0.2" />
            <circle cx="150" cy="120" r="30" fill="#3498db" opacity="0.2" />
            <circle cx="250" cy="120" r="30" fill="#2ecc71" opacity="0.2" />
            <path
              d="M 100 200 Q 200 250 300 200"
              stroke="#95a5a6"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        </div>
        <div className="notfound-buttons">
          <Link to="/" className="btn btn-primary">
            العودة إلى الصفحة الرئيسية
          </Link>
          <button
            className="btn btn-secondary"
            onClick={() => window.history.back()}
          >
            للخلف
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
