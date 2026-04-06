import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import logo from '../../assets/images/logo.png';

export default function Header({ onMenuClick }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
            <img src={logo} alt="ChatChit" className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 font-bangers-regular">ChatChit</h1>
          <div className="hidden md:flex items-center space-x-1 px-2 py-1 bg-primary-50 rounded-lg">
            <ShieldCheckIcon className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-primary-700">E2EE</span>
          </div>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <UserCircleIcon className="h-6 w-6" />
            <span className="hidden md:inline text-sm font-medium">{user?.username}</span>
            <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                disabled
              >
                <Cog6ToothIcon className="h-4 w-4" />
                <span>Settings</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handler */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
} 