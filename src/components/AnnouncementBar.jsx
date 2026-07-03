import { useState } from 'react';

export function AnnouncementBar({ config }) {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;
  
  // Use config announcement if available, otherwise use default
  const { mainText, subText } = config.announcement || {};
  const displayText = mainText || "🎉 Free shipping on orders over ₹500 | Premium Himalayan salts & spices";
  
  return (
    <div className="announcement-bar">
      <div className="announcement-bar__content page-width">
        <p className="announcement-bar__message">
          {displayText}
          {subText && <span className="announcement-bar__sub">{subText}</span>}
        </p>
        <button 
          type="button" 
          className="announcement-bar__close"
          onClick={() => setIsVisible(false)}
          aria-label="Close announcement"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
