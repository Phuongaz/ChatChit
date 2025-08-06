import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import logo from '../assets/images/logo.png';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <img src={logo} alt="ChatChit" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-bangers-regular">ChatChit</h1>
          <p className="text-gray-600 font-baloo">Trò chuyện an toàn</p>
        </div>

        {/* Auth forms */}
        {isLogin ? (
          <LoginForm onToggleForm={toggleForm} />
        ) : (
          <RegisterForm onToggleForm={toggleForm} />
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 rounded-lg mb-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Bảo mật</h3>
            <p className="text-xs text-gray-500">Mã hóa đầu cuối</p>
          </div>
          
          <div className="p-3">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 rounded-lg mb-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Nhanh</h3>
            <p className="text-xs text-gray-500">Trò chuyện thời gian thực</p>
          </div>
          
          <div className="p-3">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 rounded-lg mb-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Riêng tư</h3>
            <p className="text-xs text-gray-500">Dữ liệu của bạn, kiểm soát của bạn</p>
          </div>
        </div>
      </div>
    </div>
  );
} 