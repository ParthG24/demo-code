import React from 'react';
import { Map, FileText, Home, Users, User } from 'lucide-react';

const BottomNavigation = () => {
  const navItems = [
    { icon: Map, label: 'Map', active: true },
    { icon: Home, label: 'My Reports' },
    { icon: FileText, label: 'Report', highlight: true },
    { icon: Users, label: 'Social Feed' },
    { icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-30">
      <div className="flex items-center justify-around">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          
          if (item.highlight) {
            return (
              <button
                key={index}
                className="flex flex-col items-center p-3 bg-blue-500 rounded-2xl text-white min-w-[80px]"
              >
                <Icon size={24} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          }
          
          return (
            <button
              key={index}
              className={`flex flex-col items-center p-2 rounded-lg min-w-[60px] ${
                item.active 
                  ? 'text-blue-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;