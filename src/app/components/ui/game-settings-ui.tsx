import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Moon, Sun, HelpCircle, Home } from "lucide-react";

const GameSettingsUI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hoverEffect, setHoverEffect] = useState(false);

  // Toggle settings panel
  const toggleSettings = () => {
    setIsOpen(!isOpen);
  };

  // Toggle theme
  const toggleTheme = (e) => {
    e.preventDefault();
    setIsDarkMode(!isDarkMode);
  };

  // Add a pulse effect when game events happen
  useEffect(() => {
    const pulseTimer = setTimeout(() => {
      setHoverEffect(false);
    }, 1500);

    return () => clearTimeout(pulseTimer);
  }, [hoverEffect]);

  // Trigger pulse effect (this could be called from game events)
  const triggerPulse = () => {
    setHoverEffect(true);
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      {/* Main settings button */}
      <button
        onClick={toggleSettings}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full 
          ${
            isDarkMode
              ? "bg-gradient-to-br from-indigo-900 to-purple-700"
              : "bg-gradient-to-br from-amber-400 to-orange-500"
          } 
          shadow-lg transition-all duration-300 hover:scale-110
          ${hoverEffect ? "animate-pulse ring-4 ring-cyan-400" : ""}
          hover:shadow-cyan-500/50 group`}
        title="Game Settings"
        onMouseEnter={() => triggerPulse()}
      >
        <div className="absolute inset-1 bg-black/20 rounded-full backdrop-blur-sm flex items-center justify-center overflow-hidden">
          <Settings
            size={28}
            className={`text-white group-hover:animate-spin transition-all duration-300 
              ${isOpen ? "rotate-90 text-cyan-300" : ""}`}
          />
        </div>
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-60 animate-gradient"></div>
      </button>

      {/* Settings dropdown panel */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-52 bg-black/80 backdrop-blur-md rounded-lg overflow-hidden border border-purple-500/50 shadow-xl shadow-purple-500/20 transition-all duration-300 animate-fadeIn">
          <div className="p-2 border-b border-purple-500/30">
            <div className="text-lg text-white font-bold text-center">
              Game Options
            </div>
          </div>
          <div className="p-2 flex flex-col gap-2">
            {/* Theme toggle setting */}
            <div className="flex justify-between items-center px-3 py-2 hover:bg-white/10 rounded-md transition-colors">
              <div className="flex items-center">
                {isDarkMode ? (
                  <Moon size={18} className="text-blue-400" />
                ) : (
                  <Sun size={18} className="text-yellow-400" />
                )}
                <span className="ml-2 text-white text-sm">Theme</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-9 h-5 rounded-full flex items-center p-1 transition-colors ${
                  isDarkMode ? "bg-blue-900" : "bg-yellow-800"
                }`}
              >
                <span
                  className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                    isDarkMode ? "" : "translate-x-4"
                  }`}
                ></span>
              </button>
            </div>

            {/* Links to full settings/other pages */}
            <div className="mt-2 pt-2 border-t border-purple-500/30">
              <Link
                href="/settings"
                className="flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <Settings size={18} className="mr-2 text-purple-400" />
                <span className="text-sm">All Settings</span>
              </Link>

              <Link
                href="/help"
                className="flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <HelpCircle size={18} className="mr-2 text-cyan-400" />
                <span className="text-sm">Help & Guide</span>
              </Link>

              <Link
                href="/"
                className="flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <Home size={18} className="mr-2 text-green-400" />
                <span className="text-sm">Main Menu</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSettingsUI;
