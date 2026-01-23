import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiZap } from 'react-icons/fi';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const response = await authAPI.getGoogleAuthUrl();
      if (response.data.success) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to initiate login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <FiMail className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Business Card Automation
            </h1>
            <p className="text-gray-600">
              Scan, sync, and manage your business cards with AI
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>AI-powered card scanning with Gemini Vision</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Automatic sync to Google Contacts</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Personalized email campaigns</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Secure sign-in with Google OAuth</span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-primary-50 rounded-lg p-4 text-sm text-gray-700">
            <div className="flex items-start space-x-2">
              <FiZap className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <p>
                By continuing, you agree to share your Google account information
                with this application for authentication and accessing Google Contacts
                and Gmail.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          Built with Node.js, React, and Google AI
        </p>
      </div>
    </div>
  );
};

export default Login;