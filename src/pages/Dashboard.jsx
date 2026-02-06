import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCamera, FiCreditCard, FiMail, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import { cardsAPI, emailAPI } from '../utils/api';
import Loading from '../components/Loading';
import { getImageUrl } from '../utils/imageUtils';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [emailStats, setEmailStats] = useState(null);
  const [recentCards, setRecentCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [cardsStatsRes, emailStatsRes, recentCardsRes] = await Promise.all([
        cardsAPI.getStats(),
        emailAPI.getStats(),
        cardsAPI.getCards({ limit: 5 })
      ]);

      setStats(cardsStatsRes.data.stats);
      setEmailStats(emailStatsRes.data.stats);
      setRecentCards(recentCardsRes.data.cards);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  const statCards = [
    {
      title: 'Total Cards',
      value: stats?.total_cards || 0,
      icon: FiCreditCard,
      color: 'bg-blue-500',
      link: '/cards'
    },
    {
      title: 'Synced to Google',
      value: stats?.synced_cards || 0,
      icon: FiCheckCircle,
      color: 'bg-green-500',
      link: '/cards'
    },
    {
      title: 'Emails Sent',
      value: emailStats?.total_sent || 0,
      icon: FiMail,
      color: 'bg-purple-500',
      link: '/campaigns'
    },
    {
      title: 'Active Days',
      value: stats?.active_days || 0,
      icon: FiTrendingUp,
      color: 'bg-orange-500',
      link: '/'
    }
  ];

  const quickActions = [
    {
      title: 'Scan New Card',
      description: 'Upload and scan a business card',
      icon: FiCamera,
      link: '/scan',
      color: 'bg-primary-600'
    },
    {
      title: 'View All Cards',
      description: 'Manage your scanned cards',
      icon: FiCreditCard,
      link: '/cards',
      color: 'bg-green-600'
    },
    {
      title: 'Create Campaign',
      description: 'Send bulk emails',
      icon: FiMail,
      link: '/campaigns',
      color: 'bg-purple-600'
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow group"
            >
              <div className={`${action.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{action.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Cards</h2>
          <Link to="/cards" className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium">
            View all →
          </Link>
        </div>

        {recentCards.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
            {recentCards.map((card) => (
              <div key={card.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    {card.image_url && (
                      <img
                        src={getImageUrl(card.image_url)}
                        alt="Card"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {card.name || 'Unknown'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {card.job_title && card.company
                          ? `${card.job_title} at ${card.company}`
                          : card.company || card.email}
                      </p>
                    </div>
                  </div>
                  {card.synced_to_google && (
                    <span className="flex items-center space-x-1 text-green-600 text-xs sm:text-sm flex-shrink-0">
                      <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Synced</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
            <FiCreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm sm:text-base text-gray-600 mb-4">No cards scanned yet</p>
            <Link
              to="/scan"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              <FiCamera />
              <span>Scan Your First Card</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
