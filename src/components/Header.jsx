import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser, FiMenu } from 'react-icons/fi';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Mobile Menu Button + Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-primary-600 truncate">
              <span className="hidden sm:inline">Business Card Automation</span>
              <span className="sm:hidden">Card Auto</span>
            </h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiUser className="text-primary-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px] lg:max-w-none">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[150px] lg:max-w-none">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
