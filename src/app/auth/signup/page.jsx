"use client";
import { useSignupMutation } from '@/features/auth/authApi';
import { message } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const SignUp = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    rememberMe: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const [signUp, { isLoading }] = useSignupMutation();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // For username, only remove spaces but preserve case
    let processedValue = value;
    if (name === 'username') {
      processedValue = value.replace(/\s+/g, ''); // Only remove spaces, preserve original case
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Professional username validation - Updated to allow mixed case
  const validateUsername = (username) => {
    const errors = [];

    if (!username.trim()) {
      errors.push('Username is required');
      return errors;
    }

    // Length validation
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    if (username.length > 20) {
      errors.push('Username must be 20 characters or less');
    }

    // Character validation - only letters, numbers, underscores, and hyphens (mixed case allowed)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    // Must start with a letter (case insensitive)
    if (!/^[a-zA-Z]/.test(username)) {
      errors.push('Username must start with a letter');
    }

    // Cannot end with underscore or hyphen
    if (/[_-]$/.test(username)) {
      errors.push('Username cannot end with underscore or hyphen');
    }

    // Cannot have consecutive special characters
    if (/[_-]{2,}/.test(username)) {
      errors.push('Username cannot have consecutive underscores or hyphens');
    }

    // Reserved words check - case insensitive comparison
    const reservedWords = ['admin', 'root', 'user', 'guest', 'test', 'null', 'undefined', 'api', 'www', 'mail', 'ftp'];
    if (reservedWords.includes(username.toLowerCase())) {
      errors.push('This username is not available');
    }

    return errors;
  };

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Include at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Include at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Include at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Include at least one special character');
    }

    return errors;
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Username validation
    const usernameErrors = validateUsername(formData.username);
    if (usernameErrors.length > 0) {
      newErrors.username = usernameErrors.join(', ');
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors.join(', ');
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const response = await signUp({
          userName: formData.username,
          email: formData.email,
          password: formData.password
        }).unwrap();

        if (response.success) {
          router.push(`/auth/verify-otp?email=${formData.email}`)
        }
        setFormData({
          username: '',
          email: '',
          password: '',
          rememberMe: false
        });

      } catch (error) {
        console.error('Sign up error:', error);

        if (error.data) {
          if (error.data.message.includes('email')) {
            setErrors(prev => ({ ...prev, email: error.data.message }));
          } else if (error.data.message.includes('username')) {
            setErrors(prev => ({ ...prev, username: error.data.message }));
          } else {
            toast.error(error?.data?.message || 'Signup failed. Please try again.');
          }
        } else {
          message('Network error. Please try again.');
        }
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="">
      <div className="flex h-screen justify-center">
        {/* Left Section with Background Image and Overlay */}
        <div className="hidden md:flex md:w-1/2 justify-center relative">
          <Image
            src="/images/signup.png"
            alt="People smiling"
            layout="fill"
            objectFit="cover"
            priority
          />
        </div>

        {/* Right Section with Sign Up Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md bg-white rounded-lg p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold">Sign Up</h2>
              <p className="text-gray-600 mt-1">Create your account</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="JohnDoe or john_doe"
                    className={`w-full pl-10 pr-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                <p className="mt-2 text-xs text-gray-500">
                  3-20 characters. Must start with a letter. Mixed case allowed. Only letters, numbers, underscores, and hyphens.
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    className={`w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-500"
                  >
                    {showPassword ? <FaEyeSlash className="h-4 w-4 cursor-pointer" /> : <FaEye className="h-4 w-4 cursor-pointer" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                <p className="mt-2 text-xs text-gray-500">
                  Password must be at least 8 characters and include uppercase, lowercase,
                  number, and special character.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-indigo-600 text-white py-2 px-4 cursor-pointer rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-none ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in
              </Link>
              <div className="mt-2">
                Need help? <a href="mailto:mehorhelp@gmail.com" className="text-indigo-600 hover:text-indigo-500">mehorhelp@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;