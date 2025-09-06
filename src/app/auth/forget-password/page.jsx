"use client";
import { useForgotPasswordMutation } from '@/features/auth/authApi';
import { notification } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateEmail()) {
      setIsSubmitting(true);

      try {
        const response = await forgotPassword({ email }).unwrap();

        // Success case
        toast.success(response.message || 'Reset link sent successfully');

        if (response.success) {
          setIsSuccess(true);
          router.push(`/auth/forgot-password-otp?email=${email}`);
        }

      } catch (err) {
        // Extract error message from RTK error object
        const errorMessage = err?.data?.message || err?.message || 'Failed to send reset link';

        // Set frontend form error too, if needed
        setError(errorMessage);
        notification.error({
          message: 'Error',
          description: errorMessage,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="">
      <div className="flex h-screen justify-center">
        {/* Left Section with Background Image and Overlay */}
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
              <h2 className="text-2xl font-semibold">Forgot Password</h2>
              <p className="text-gray-600 mt-1">
                {isSuccess
                  ? "Check your email for further instructions"
                  : "Enter your email to reset your password"}
              </p>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
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
                    value={email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer ${(isSubmitting || isLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {(isSubmitting || isLoading) ? 'Sending...' : 'Send Reset OTP'}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;