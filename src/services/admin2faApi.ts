import config from '../config/environment';

const API_BASE_URL = config.apiBaseUrl;

export interface SendOtpResponse {
  success: boolean;
  message: string;
  tempToken: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  authToken: string;
}

export const admin2faApi = {
  async sendOtp(username: string, password: string): Promise<SendOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send OTP');
    }

    return response.json();
  },

  async verifyOtp(otp: string, tempToken: string): Promise<VerifyOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ otp, tempToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Invalid or expired OTP');
    }

    return response.json();
  },
};