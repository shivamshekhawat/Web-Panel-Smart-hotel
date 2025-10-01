import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { User, Phone, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { adminApi, ApiError } from '../services/api';

interface SignUpProps {
  onSignUp: (userData: SignUpData) => void;
  onBackToLogin: () => void;
}

export interface SignUpData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  username: string;
  password: string;
  session_id: string;
}

const generateSessionId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
 
};


const SignUp: React.FC<SignUpProps> = ({ onSignUp, onBackToLogin }) => {
  const [formData, setFormData] = useState<SignUpData>({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    username: '',
    password: '',
    session_id: generateSessionId(),
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<SignUpData & { confirmPassword: string }>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignUpData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Clear messages when user starts typing
    if (successMessage) setSuccessMessage(null);
    if (apiError) setApiError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SignUpData & { confirmPassword: string }> = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.mobile_number.trim()) newErrors.mobile_number = 'Mobile number is required';
    else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.mobile_number.replace(/\s/g, '')))
      newErrors.mobile_number = 'Please enter a valid mobile number';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const response = await adminApi.signUp(formData);

      // Treat any successful HTTP response as success unless backend explicitly returns success: false
      const isExplicitFailure = typeof (response as any)?.success !== 'undefined' && (response as any).success === false;

      if (isExplicitFailure) {
        setApiError((response as any).message || 'Failed to create admin account');
      } else {
        setSuccessMessage('Admin account created successfully! Logging you in...');
        
        // Automatically attempt login after successful signup
        try {
          const loginResponse = await adminApi.login({
            username: formData.username,
            password: formData.password,
            session_id: formData.session_id,
          });

          if (loginResponse.message === 'Login successful' && loginResponse.token) {
            // Create user object for the parent callback
            const user = {
              username: loginResponse.admin?.first_name + ' ' + loginResponse.admin?.last_name || formData.username,
              email: loginResponse.admin?.email || formData.email,
              role: 'Hotel Administrator',
              accessScope: 'full',
            };
            
            setSuccessMessage('Account created and logged in successfully!');
            
            // Call the parent callback with user data (this will trigger login)
            setTimeout(() => {
              onSignUp(formData);
            }, 1500);
          } else {
            setSuccessMessage('Account created successfully! You can now sign in manually.');
            onSignUp(formData);
          }
        } catch (loginError) {
          console.log('Auto-login failed after signup:', loginError);
          setSuccessMessage('Account created successfully! You can now sign in manually.');
          onSignUp(formData);
        }

        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            first_name: '',
            last_name: '',
            email: '',
            mobile_number: '',
            username: '',
            password: '',
            session_id: generateSessionId(),
          });
          setConfirmPassword('');
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
      <div className="w-full max-w-4xl">
        <Card className="shadow-xl border rounded-2xl bg-white">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <img 
                src="/image/hyatt-regency-seeklogo 1 (1).png" 
                alt="Hotel Logo" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Admin Registration</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Create a new admin account for hotel management
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Hidden Session ID Field */}
              <input type="hidden" name="session_id" value={formData.session_id} readOnly />

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['first_name', 'last_name', 'email', 'mobile_number'].map((field) => {
                  const labels: Record<string, string> = {
                    first_name: 'First Name *',
                    last_name: 'Last Name *',
                    email: 'Email Address *',
                    mobile_number: 'Mobile Number *'
                  };
                  const icons: Record<string, JSX.Element> = {
                    first_name: <User className="h-4 w-4" />,
                    last_name: <User className="h-4 w-4" />,
                    email: <Mail className="h-4 w-4" />,
                    mobile_number: <Phone className="h-4 w-4" />
                  };
                  return (
                    <div className="space-y-2" key={field}>
                      <label htmlFor={field} className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        {icons[field]} {labels[field]}
                      </label>
                      <Input
                        id={field}
                        name={field}
                        type={field === 'email' ? 'email' : 'text'}
                        value={formData[field as keyof SignUpData]}
                        onChange={handleInputChange}
                        placeholder={`Enter ${labels[field].toLowerCase()}`}
                        className={errors[field as keyof SignUpData] ? 'border-red-500 focus:ring-red-500' : ''}
                      />
                      {errors[field as keyof SignUpData] && <p className="text-sm text-red-500">{errors[field as keyof SignUpData]}</p>}
                    </div>
                  );
                })}
              </div>

              {/* Account Credentials */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Account Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" /> Username *
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="admin"
                      className={errors.username ? 'border-red-500 focus:ring-red-500' : ''}
                    />
                    {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Password *
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter secure password"
                        className={`pr-12 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Confirm Password *
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`pr-12 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">{successMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {apiError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">{apiError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="button" variant="outline" onClick={onBackToLogin} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    'Create Admin Account'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button type="button" onClick={onBackToLogin} className="text-blue-600 hover:underline font-medium">
                  Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          © 2025 Hotel Admin Panel. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default SignUp;
