import React from "react";

export default function LoadingSpinner({ size = "medium" }) {
  const sizeClass = {
    small: "loading-spinner-small",
    medium: "loading-spinner-medium",
    large: "loading-spinner-large"
  }[size];

  return (
    <div className={`loading-spinner ${sizeClass}`}>
      <div className="spinner"></div>
    </div>
  );
}