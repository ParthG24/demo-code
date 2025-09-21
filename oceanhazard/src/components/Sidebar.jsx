import React from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static top-16 left-0 h-[calc(100vh-64px)]
        w-72 md:w-64 bg-gray-800 text-white border-r border-gray-600
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          {/* Empty sidebar - will be filled later */}
          <div className="text-gray-400 text-center mt-8">
            Sidebar content will be added here
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;