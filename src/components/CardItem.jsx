import { useState } from 'react';
import { FiMail, FiPhone, FiBriefcase, FiMapPin, FiGlobe, FiTrash2, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { cardsAPI } from '../utils/api';

const CardItem = ({ card, onUpdate, onDelete }) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await cardsAPI.syncCard(card.id);
      if (response.data.success) {
        toast.success('Card synced to Google Contacts!');
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to sync card');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    
    try {
      await cardsAPI.deleteCard(card.id);
      toast.success('Card deleted successfully');
      if (onDelete) onDelete(card.id);
    } catch (error) {
      toast.error('Failed to delete card');
      console.error(error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          {card.image_url && (
            <img
              src={card.image_url}
              alt="Business card"
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{card.name || 'Unknown'}</h3>
            {card.job_title && (
              <p className="text-sm text-gray-600">{card.job_title}</p>
            )}
            {card.company && (
              <p className="text-sm text-gray-600">{card.company}</p>
            )}
          </div>
        </div>

        {card.synced_to_google && (
          <div className="flex items-center space-x-1 text-green-600 text-sm">
            <FiCheckCircle className="w-4 h-4" />
            <span>Synced</span>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {card.email && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiMail className="w-4 h-4" />
            <a href={`mailto:${card.email}`} className="hover:text-primary-600">
              {card.email}
            </a>
          </div>
        )}

        {card.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiPhone className="w-4 h-4" />
            <a href={`tel:${card.phone}`} className="hover:text-primary-600">
              {card.phone}
            </a>
          </div>
        )}

        {card.website && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiGlobe className="w-4 h-4" />
            <a
              href={card.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600"
            >
              {card.website}
            </a>
          </div>
        )}

        {card.address && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiMapPin className="w-4 h-4" />
            <span>{card.address}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleSync}
          disabled={syncing || card.synced_to_google}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            card.synced_to_google
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {syncing ? 'Syncing...' : card.synced_to_google ? 'Already Synced' : 'Sync to Contacts'}
        </button>

        <button
          onClick={() => {/* Implement edit */}}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          title="Edit card"
        >
          <FiEdit2 />
        </button>

        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
          title="Delete card"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

export default CardItem;