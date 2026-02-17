import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const HITAMTreeLoading: React.FC<LoadingAnimationProps> = ({ 
  size = 'md', 
  className,
  showText = true 
}) => {
  // Force re-render to restart animations every time component mounts
  const [animationKey, setAnimationKey] = useState(0);
  
  useEffect(() => {
    // Generate a unique key when component mounts to ensure animations restart
    setAnimationKey(Date.now());
  }, []);

  const sizeClasses = {
    sm: 'w-80 h-80',
    md: 'w-[28rem] h-[28rem]', 
    lg: 'w-[40rem] h-[40rem]'
  };

  // Use the exact file path for the logo
  const logoPath = '/hitam-tree-logo.png';

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {/* HITAM Tree Container with filling animation */}
      <div 
        key={`hitam-tree-${animationKey}`}
        className={cn("relative overflow-hidden", sizeClasses[size])}
      >
        {/* Base HITAM Tree Image */}
        <img 
          src={logoPath} 
          alt="HITAM Tree Logo"
          className="w-full h-full object-contain opacity-30 grayscale"
        />
        
        {/* Colored Tree Overlay with Rising Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={logoPath} 
            alt="HITAM Tree Logo"
            className="w-full h-full object-contain hitam-tree-rising"
          />
        </div>
        

        

        

      </div>
      
      {showText && (
        <div 
          key={`text-${animationKey}`}
          className="mt-6 text-center space-y-2 hitam-text-fadeup"
        >
          <p className="text-xl font-bold text-foreground">
            LOADING YOUR WORKSPACE...
          </p>

        </div>
      )}
    </div>
  );
};

export const LoadingSpinner: React.FC<LoadingAnimationProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size], className)} />
  );
};