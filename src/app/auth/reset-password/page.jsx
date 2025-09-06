"use client";
import { useResetPasswordMutation } from '@/features/auth/authApi';
import { notification } from 'antd';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaCheck, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resetToken, setResetToken] = useState('');

  const [resetPassword, { isLoading, isError, error }] = useResetPasswordMutation();

  // Get token from URL or localStorage (client-side only)
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem("forgot-password-otp-token") : null;
    setResetToken(tokenFromUrl || tokenFromStorage || '');
  }, [searchParams]);

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validatePassword = (password) => {
    const validations = {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    setPasswordValidation(validations);
    return Object.values(validations).every(v => v);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate password when newPassword changes
    if (name === 'newPassword') {
      validatePassword(value);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      newPassword: '',
      confirmPassword: ''
    };

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = 'Password does not meet requirements';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      notification.error({
        message: 'Invalid Token',
        description: 'Password reset token is missing or invalid',
      });
      return;
    }

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        await resetPassword({
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }).unwrap();

        // Clear token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem("forgot-password-otp-token");
        }

        setIsSuccess(true);
        notification.success({
          message: 'Password Reset Successful',
          description: 'Your password has been updated successfully',
        });

        setFormData({
          newPassword: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } catch (error) {
        notification.error({
          message: 'Reset Failed',
          description: error?.data?.message || 'Failed to reset password. Please try again.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="">
      <div className="flex h-screen justify-center">
        {/* Left Section with Background Image */}
        <div className="hidden md:flex md:w-1/2 justify-center relative">
          <Image
            src="/images/login.png"
            alt="People smiling"
            layout="fill"
            objectFit="cover"
          />
        </div>

        {/* Right Section with Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md bg-white rounded-lg p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold">Reset Password</h2>
              <p className="text-gray-600 mt-1">
                {isSuccess ? 'Password updated successfully!' : 'Create a new password for your account'}
              </p>
            </div>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className={`w-full pl-10 pr-10 py-2 border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    <button
                      type="button"
                      onClick={toggleNewPasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-500"
                    >
                      {showNewPassword ? <FaEyeSlash className="h-4 w-4 cursor-pointer" /> : <FaEye className="h-4 w-4 cursor-pointer" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}

                  {/* Password Requirements */}
                  <div className="mt-2 text-xs">
                    <p className="text-gray-500 font-medium mb-1">Password must include:</p>
                    <div className="grid grid-cols-2 gap-1">
                      <div className={`flex items-center ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.hasMinLength ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.hasUpperCase ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.hasLowerCase ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.hasNumber ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.hasSpecialChar ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className={`w-full pl-10 pr-10 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-500"
                    >
                      {showConfirmPassword ? <FaEyeSlash className="h-4 w-4 cursor-pointer" /> : <FaEye className="h-4 w-4 cursor-pointer" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !resetToken || isLoading}
                  className={`w-full cursor-pointer bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${(isSubmitting || !resetToken || isLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {(isSubmitting || isLoading) ? 'Resetting...' : 'Reset Password'}
                </button>

                {!resetToken && (
                  <p className="mt-2 text-sm text-red-600">
                    Password reset token is missing. Please request a new password reset link.
                  </p>
                )}
              </form>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="mt-2 text-gray-600">You can now login with your new password</p>
                </div>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;