import React from 'react';
import { Star, Bell, User, Plus } from 'lucide-react';

const Header = ({ onReportClick }) => {
  return (
    <header className="bg-gray-800 px-4 py-3 flex items-center justify-between text-white h-16 border-b border-gray-600">
      {/* Left Side - Logo */}
      <div className="flex items-center gap-3">
        <div className="logo flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded flex items-center justify-center text-white text-xs">
            🌊
          </div>
          <span className="font-medium text-white hidden sm:block">Logo</span>
        </div>
      </div>
      
      {/* Center - Navigation (Desktop only) */}
      <nav className="hidden md:flex gap-8">
        <a href="#" className="text-sky-500 py-2 border-b-2 border-sky-500 transition-all">
          Map
        </a>
        <a href="#" className="text-gray-400 hover:text-sky-500 py-2 border-b-2 border-transparent hover:border-sky-500 transition-all">
          My Reports
        </a>
        <a href="#" className="text-gray-400 hover:text-sky-500 py-2 border-b-2 border-transparent hover:border-sky-500 transition-all">
          Social Feed
        </a>
      </nav>
      
      {/* Right Side - Icons */}
      <div className="flex gap-2">
        <button 
          onClick={onReportClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          <span className="hidden sm:block">Report</span>
        </button>
        <button className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded transition-all">
          <Star size={20} />
        </button>
        <button className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded transition-all">
          <Bell size={20} />
        </button>
        <button className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded transition-all">
          <User size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;