import React from "react";

interface SpinnerProps {
  className?: string;
  variant?: "default" | "small";
}

export const Spinner = ({
  className = "",
  variant = "default"
}: SpinnerProps) => {
  const sizeClasses = variant === "small" 
    ? "h-4 w-4 border-2" 
    : "h-8 w-8 border-4";

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`animate-spin rounded-full border-solid border-primary border-t-transparent ${sizeClasses}`}
      />
    </div>
  );
};