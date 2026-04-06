import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { 
  generateKeyPair, 
  generateSalt, 
  generateIV, 
  hashPassword, 
  encryptPrivateKey,
  stringToHex
} from '../../utils/crypto';
import logo from '../../assets/images/logo.png';

export default function RegisterForm({ onToggleForm }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  
  const { register, checkUsername, login, isLoading } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Nhập tên người dùng';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Tên người dùng chỉ có thể chứa chữ cái, số và dấu gạch dưới';
    }
    
    if (!formData.password) {
      newErrors.password = 'Nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsGeneratingKeys(true);

    try {
      // Check if username is available
      const checkResult = await checkUsername(formData.username);
      if (!checkResult.success) {
        toast.error(checkResult.error);
        setIsGeneratingKeys(false);
        return;
      }

      if (!checkResult.available) {
        setErrors({ username: 'Username is already taken' });
        setIsGeneratingKeys(false);
        return;
      }

      const { publicKey, privateKey } = generateKeyPair();
      
      const salt = generateSalt();
      const iv = generateIV();
      
      const hashedPassword = hashPassword(formData.password, salt);
      
      const encryptedPrivateKey = encryptPrivateKey(privateKey, formData.password, salt, iv);

      const registrationData = {
        username: formData.username,
        password: hashedPassword,
        public_key: publicKey,
        private_encrypted_key: encryptedPrivateKey,
        iv: stringToHex(iv),
        salt: stringToHex(salt)
      };

      const result = await register(registrationData);
      
      if (result.success) {
        toast.success('Đăng ký thành công! Đang đăng nhập...');
        const loginResult = await login(formData.username, formData.password);
        if (!loginResult.success) {
          toast.error(loginResult.error || 'Đăng nhập tự động thất bại, vui lòng đăng nhập thủ công.');
          onToggleForm();
        }
      } else {
        toast.error(result.error || 'Đăng ký thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi tạo khóa mã hóa. Vui lòng thử lại.');
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const isSubmitting = isLoading || isGeneratingKeys;

  return (
    <div className="card max-w-md mx-auto font-baloo">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Đăng ký</h2>
        {/* <p className="text-gray-600 mt-2">Tham gia ChatChit với mã hóa đầy đủ</p> */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Tên người dùng
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`input-field ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Chọn tên người dùng"
            disabled={isSubmitting}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input-field pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Tạo mật khẩu mạnh"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Xác nhận mật khẩu"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {isGeneratingKeys && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-primary-700">
                Đang tạo khóa mã hóa...
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isGeneratingKeys ? 'Đang tạo tài khoản...' : 'Đang đăng ký...'}
            </div>
          ) : (
            'Đăng ký'
          )}
        </button>

        <div className="text-center">
          <p className="text-gray-600">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </form>
    </div>
  );
} 