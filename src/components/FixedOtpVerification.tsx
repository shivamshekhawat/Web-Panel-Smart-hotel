import React, { useState } from 'react';

const API_BASE_URL = 'https://09ecf30ac848.ngrok-free.app';

interface OtpVerificationProps {
  email: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const FixedOtpVerification: React.FC<OtpVerificationProps> = ({ 
  email, 
  onSuccess, 
  onError 
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email?.trim() || !otp?.trim()) {
      onError('Email and OTP are required');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email: email.trim(),
        otp: otp.trim()
      };

      console.log('OTP verification payload:', payload);

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Invalid or expired OTP');
      }

      if (data.success) {
        onSuccess();
      } else {
        throw new Error(data.error || 'OTP verification failed');
      }

    } catch (error: any) {
      console.error('OTP verification error:', error);
      onError(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-4 py-3 border rounded-lg bg-gray-50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">OTP Code</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </button>
    </form>
  );
};