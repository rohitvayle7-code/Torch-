import React from 'react';

interface ScreenOverlayProps {
  isOn: boolean;
  color: string;
  brightness: number; // 0-100
  isVisible: boolean; // Is it fully rendered?
}

export const ScreenOverlay: React.FC<ScreenOverlayProps> = ({ isOn, color, brightness, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-100"
      style={{
        backgroundColor: color,
        opacity: isOn ? brightness / 100 : 0,
      }}
    />
  );
};