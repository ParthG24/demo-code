import React from 'react';
import { Menu } from 'lucide-react';

const MobileMenuButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-20 left-4 z-50 bg-gray-800 text-white p-2 rounded border border-gray-600 md:hidden hover:bg-gray-700 transition-colors"
    >
      <Menu size={20} />
    </button>
  );
};

export default MobileMenuButton;