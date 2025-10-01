import { useState } from 'react';
import { authApi } from '../services/authApi';

interface PasswordResetState {
  email: string;
  otp: string;
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export const usePasswordReset = () => {
  const [state, setState] = useState<PasswordResetState>({
    email: '',
    otp: '',
    isLoading: false,
    error: null,
    success: null,
  });

  const setEmail = (email: string) => {
    setState(prev => ({ ...prev, email, error: null, success: null }));
  };

  const setOtp = (otp: string) => {
    setState(prev => ({ ...prev, otp, error: null, success: null }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, success: null }));
  };

  const setSuccess = (success: string | null) => {
    setState(prev => ({ ...prev, success, error: null }));
  };

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const sendOtp = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.sendOtp(email);
      if (data.success) {
        setEmail(email);
        setSuccess(data.message || 'OTP has been sent to your email');
        return true;
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.verifyOtp(email, otp);
      if (data.success) {
        setOtp(otp);
        setSuccess(data.message || 'OTP verified successfully');
        return true;
      } else {
        throw new Error(data.message || 'Invalid OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Invalid OTP. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.resetPassword(email, otp, newPassword, confirmPassword);
      if (data.success) {
        setSuccess(data.message || 'Password has been reset successfully');
        return true;
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithNewPassword = async (email: string, password: string): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.login(email, password);
      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        if (data.user) {
          localStorage.setItem('user_info', JSON.stringify(data.user));
        }
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    ...state,
    sendOtp,
    verifyOtp,
    resetPassword,
    loginWithNewPassword,
    setError,
    setSuccess,
  };
};