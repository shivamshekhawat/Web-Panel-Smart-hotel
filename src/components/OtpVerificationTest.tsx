import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const API_BASE_URL = 'https://557fd583d2a4.ngrok-free.app';

export const OtpVerificationTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    // Validate inputs
    if (!email.trim()) {
      setMessage('Email is required');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (!otp.trim()) {
      setMessage('OTP is required');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    const payload = {
      email: email.trim(),
      otp: otp.trim()
    };

    console.log('=== OTP VERIFICATION DEBUG ===');
    console.log('Payload:', payload);
    console.log('API URL:', `${API_BASE_URL}/api/auth/verify-otp`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        console.error('Error response data:', data);
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      console.log('Success response data:', data);
      setMessage(data.message || 'OTP verified successfully!');
      setIsError(false);

    } catch (error: any) {
      console.error('OTP verification error:', error);
      setMessage(error.message || 'Failed to verify OTP');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">OTP Verification Test</CardTitle>
            <CardDescription>Test the OTP verification endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">OTP</label>
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </form>

            {message && (
              <div className={`mt-4 p-3 rounded-lg border ${
                isError 
                  ? 'bg-red-50 border-red-200 text-red-600' 
                  : 'bg-green-50 border-green-200 text-green-600'
              }`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Debug Info:</h4>
              <p className="text-xs text-gray-600">API URL: {API_BASE_URL}/api/auth/verify-otp</p>
              <p className="text-xs text-gray-600">Check browser console for detailed logs</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};