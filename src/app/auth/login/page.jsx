"use client";
import { useLoginMutation } from '@/features/auth/authApi';
import { jwtDecode } from "jwt-decode";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { decodedUser, saveToken } from '../../../features/auth/authService';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({
    username: '',
    password: '',
    rememberMe: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [Login, { isLoading }] = useLoginMutation();

  // Load saved credentials and optionally reload once
  useEffect(() => {
    const shouldReload = localStorage.getItem('shouldReloadAfterLogin');

    if (shouldReload) {
      localStorage.removeItem('shouldReloadAfterLogin'); // Clean up flag
      window.location.reload(); // Only reload once
    }

    localStorage.setItem("theme", "light");

    // Check if credentials are saved in localStorage
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      const { username, password } = JSON.parse(savedCredentials);
      setFormData(prev => ({
        ...prev,
        username,
        password,
        rememberMe: true
      }));
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value.trim()
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.username.trim()) {
      newErrors.username = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.username.trim())) {
      newErrors.username = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        const response = await Login({ email: formData.username, password: formData.password }).unwrap();

        const decoded = jwtDecode(response?.data?.accessToken);
        if (decoded.role === "USER") {
          if (formData.rememberMe) {
            localStorage.setItem('rememberedCredentials', JSON.stringify({
              username: formData.username,
              password: formData.password
            }));
          } else {
            localStorage.removeItem('rememberedCredentials');
            localStorage.removeItem('rememberUser');
          }

          localStorage.setItem('isLoggedIn', true);
          saveToken(response?.data?.accessToken);
          decodedUser(response?.data?.accessToken);

          // Set reload flag before redirect
          localStorage.setItem('shouldReloadAfterLogin', 'true');

          router.push("/");
        } else {
          toast.error("This email is reserved for admin accounts. Please provide an alternate email.")
        }

        // Save or remove credentials based on rememberMe

      } catch (error) {
        console.error('Login error:', error);
        toast.error(error?.data?.message || 'Something went wrong!');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left Section with Background Image - Hidden on mobile */}
        <div className="hidden md:flex md:w-1/2 relative">
          <Image
            src="/images/login.png"
            alt="People smiling"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right Section with Login Form */}
        <div className="w-full md:w-1/2 flex h-screen items-center justify-center p-4 md:p-8 bg-gray-50">
          <div className="w-full max-w-md bg-white rounded-lg p-6 md:p-8 shadow-sm">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl font-semibold">Sign In</h2>
              <p className="text-gray-600 mt-1">Sign in to continue</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-700 mb-2">Email</label>
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
                    placeholder="james@gmail.com"
                    className={`w-full pl-10 pr-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash className="h-4 w-4 cursor-pointer" /> : <FaEye className="h-4 w-4 cursor-pointer" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link href="/auth/forget-password" className="text-[#0000FF] hover:text-indigo-500">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-[#0000FF] cursor-pointer text-white py-2 px-4 rounded-md hover:bg-[#0000FF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-gray-600">
              You don't have an account yet?{' '}
              <Link href="/auth/signup" className="text-[#0000FF] hover:text-indigo-500 font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;