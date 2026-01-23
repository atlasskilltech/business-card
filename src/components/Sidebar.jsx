import { NavLink } from 'react-router-dom';
import { FiHome, FiCamera, FiCreditCard, FiMail } from 'react-icons/fi';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/scan', icon: FiCamera, label: 'Scan Card' },
    { path: '/cards', icon: FiCreditCard, label: 'My Cards' },
    { path: '/campaigns', icon: FiMail, label: 'Email Campaigns' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;