import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function AuthErrorFallback({ error, resetErrorBoundary }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to login after 5 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Authentication Error</h2>
          <div className="mt-4 text-center text-red-600">
            {error?.message || "Your session has expired or is invalid."}
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please log in again to continue.
            <br />
            <span className="text-xs text-gray-500">
              You will be redirected to the login page in 5 seconds...
            </span>
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userData');
              resetErrorBoundary();
              navigate('/login');
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Login Now
          </button>
        </div>
      </div>
    </div>
  );
}

AuthErrorFallback.propTypes = {
  error: PropTypes.object,
  resetErrorBoundary: PropTypes.func
};