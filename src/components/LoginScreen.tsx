import { useState, useEffect } from 'react';
import { User } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Lock, User as UserIcon, Eye, EyeOff, UserPlus, Mail, ArrowLeft, Shield } from 'lucide-react';
import SignUp, { SignUpData } from './SignUp';
import { adminApi } from '../services/api';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { admin2faApi } from '../services/admin2faApi';

type ActiveScreen = 'login' | 'signup' | 'forgotPassword' | 'verifyOtp' | 'resetPassword';

// Interface for stored admin accounts
interface StoredAdmin {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  username: string;
  password: string;
  session_id: string;
}

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

interface ForgotPasswordProps {
  onNext: () => void;
  onBack: () => void;
}

interface VerifyOtpProps {
  email: string;
  onNext: () => void;
  onBack: () => void;
}

interface ResetPasswordProps {
  onSuccess: () => void;
  onBack: () => void;
}

// ForgotPassword Component
const ForgotPassword: React.FC<ForgotPasswordProps & { onEmailSet: (email: string) => void }> = ({ onNext, onBack, onEmailSet }) => {
  const [email, setEmail] = useState('');
  const { isLoading, error, sendOtp } = usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      return;
    }
    const success = await sendOtp(email.trim());
    if (success) {
      onEmailSet(email.trim());
      onNext();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border bg-white">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/image/hyatt-regency-seeklogo 1 (1).png" 
                alt="Hotel Logo" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Enter your email to receive an OTP
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending OTP...</span>
                  </div>
                ) : (
                  'Send OTP'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// VerifyOtp Component
const VerifyOtp: React.FC<VerifyOtpProps & { onOtpSet: (otp: string) => void }> = ({ email, onNext, onBack, onOtpSet }) => {
  const [otp, setOtp] = useState('');
  const { isLoading, error, verifyOtp } = usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim()) {
      return;
    }
    console.log('Attempting to verify OTP for email:', email, 'with OTP:', otp);
    const success = await verifyOtp(email.trim(), otp.trim());
    if (success) {
      onOtpSet(otp.trim());
      onNext();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border bg-white">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/image/hyatt-regency-seeklogo 1 (1).png" 
                alt="Hotel Logo" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Verify OTP
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Enter the OTP sent to {email}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  OTP Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ResetPassword Component
const ResetPassword: React.FC<ResetPasswordProps & { email: string; otp: string }> = ({ email, otp, onSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isLoading, error, resetPassword, setError } = usePasswordReset();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const success = await resetPassword(email, otp, formData.newPassword, formData.confirmPassword);
    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border bg-white">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/image/hyatt-regency-seeklogo 1 (1).png" 
                alt="Hotel Logo" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Reset Password
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Enter your new password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('login');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    otp: '',
    session_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordReset = usePasswordReset();

  // Helper functions for user management
  const getStoredAdmins = (): StoredAdmin[] => {
    const stored = localStorage.getItem('hotel_admins');
    return stored ? JSON.parse(stored) : [];
  };

  const storeAdmin = (adminData: SignUpData): void => {
    const existingAdmins = getStoredAdmins();
    existingAdmins.push(adminData);
    localStorage.setItem('hotel_admins', JSON.stringify(existingAdmins));
  };

  const findAdminByCredentials = (usernameOrEmail: string, password: string): StoredAdmin | null => {
    const admins = getStoredAdmins();
    return admins.find(admin => 
      (admin.email === usernameOrEmail || admin.username === usernameOrEmail) && 
      admin.password === password
    ) || null;
  };

  useEffect(() => {
    // Auto-generate a 6-digit session id on mount if not set
    const generateSessionId = () => String(Math.floor(100000 + Math.random() * 900000));
    setFormData(prev => ({ ...prev, session_id: prev.session_id || generateSessionId() }));

    document.title = 'Hotel Management System';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Hotel Management System');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Hotel Management System';
      document.head.appendChild(meta);
    }

    const noindexMeta = document.querySelector('meta[name="robots"]');
    if (noindexMeta) {
      noindexMeta.setAttribute('content', 'noindex, nofollow');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }

    return () => {
      document.title = 'Hotel Management System';
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await admin2faApi.sendOtp(formData.username, formData.password);
      if (response.success) {
        setTempToken(response.tempToken);
        setIsOtpSent(true);
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Invalid credentials or failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    if (!tempToken) {
      setError('Session expired. Please try again.');
      handleBackToCredentials();
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await admin2faApi.verifyOtp(formData.otp, tempToken);
      if (response.success && response.authToken) {
        // Save auth token using the same key as adminApi
        localStorage.setItem('auth_token', response.authToken);
        
        // Create user object
        const user: User = {
          username: formData.username,
          email: formData.username,
          role: 'Hotel Administrator',
          accessScope: 'full',
        };
        
        // Call onLogin which will trigger hotel checking in App.tsx
        onLogin(user);
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setError(error.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setIsOtpSent(false);
    setTempToken(null);
    setFormData(prev => ({ ...prev, otp: '' }));
    setError(null);
  };

  const handleSignUp = (signUpData: SignUpData) => {
    // Store the new admin account in localStorage
    storeAdmin(signUpData);
    console.log('New admin account created:', signUpData);
    
    // Show success message and switch back to login
    setActiveScreen('login');
    setError(null);
    
    // Optionally, you can automatically log them in:
    // const newUser: User = {
    //   username: signUpData.username,
    //   email: signUpData.email,
    //   role: 'Hotel Administrator',
    //   accessScope: 'full',
    // };
    // onLogin(newUser);
  };

  const handleBackToLogin = () => {
    setActiveScreen('login');
    setError(null);
  };

  // Handle different screens based on activeScreen state
  if (activeScreen === 'signup') {
    return (
      <SignUp 
        onSignUp={handleSignUp} 
        onBackToLogin={handleBackToLogin} 
      />
    );
  }

  if (activeScreen === 'forgotPassword') {
    return (
      <ForgotPassword
        onNext={() => setActiveScreen('verifyOtp')}
        onBack={() => setActiveScreen('login')}
        onEmailSet={(email) => setForgotPasswordEmail(email)}
      />
    );
  }

  if (activeScreen === 'verifyOtp') {
    return (
      <VerifyOtp
        email={forgotPasswordEmail}
        onNext={() => setActiveScreen('resetPassword')}
        onBack={() => setActiveScreen('forgotPassword')}
        onOtpSet={(otp) => setForgotPasswordOtp(otp)}
      />
    );
  }

  if (activeScreen === 'resetPassword') {
    return (
      <ResetPassword
        email={forgotPasswordEmail}
        otp={forgotPasswordOtp}
        onSuccess={() => {
          setActiveScreen('login');
          setError(null);
        }}
        onBack={() => setActiveScreen('verifyOtp')}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border bg-white">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/image/hyatt-regency-seeklogo 1 (1).png" 
                alt="Hotel Logo" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Sign in to your hotel admin panel
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    disabled={isOtpSent}
                    className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      isOtpSent ? 'bg-gray-50' : 'bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    disabled={isOtpSent}
                    className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      isOtpSent ? 'bg-gray-50' : 'bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isOtpSent && (
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                    OTP Code
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={formData.otp}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {!isOtpSent && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setActiveScreen('forgotPassword')}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isOtpSent ? 'Verifying...' : 'Sending OTP...'}</span>
                  </div>
                ) : (
                  isOtpSent ? 'Verify OTP' : 'Send OTP'
                )}
              </Button>

              {isOtpSent && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToCredentials}
                  className="w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              {/* Sign Up Button */}
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveScreen('signup')}
                  className="w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  Create New Admin Account
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Demo credentials: <span className="font-medium">admin@email.com / password</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Or use any account you created through sign up
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            © 2025 Hotel Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
