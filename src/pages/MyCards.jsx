import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { cardsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import CardItem from '../components/CardItem';
import Loading from '../components/Loading';

const MyCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await cardsAPI.getCards({ limit: 50 });
      setCards(response.data.cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (cardId) => {
    setCards(cards.filter(card => card.id !== cardId));
  };

  const handleBatchSync = async () => {
    if (selectedCards.length === 0) {
      toast.warning('Please select cards to sync');
      return;
    }

    setSyncing(true);
    try {
      const response = await cardsAPI.batchSync(selectedCards);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchCards();
        setSelectedCards([]);
      }
    } catch (error) {
      console.error('Batch sync error:', error);
      toast.error('Failed to sync cards');
    } finally {
      setSyncing(false);
    }
  };

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const filteredCards = cards.filter(card =>
    card.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading text="Loading your cards..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Cards</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {cards.length} card{cards.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        <button
          onClick={fetchCards}
          className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {selectedCards.length > 0 && (
          <button
            onClick={handleBatchSync}
            disabled={syncing}
            className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
          >
            <span>
              {syncing ? 'Syncing...' : `Sync ${selectedCards.length} Selected`}
            </span>
          </button>
        )}
      </div>

      {/* Selection Mode Toggle */}
      {cards.length > 0 && (
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
          <button
            onClick={() => {
              if (selectedCards.length === filteredCards.length) {
                setSelectedCards([]);
              } else {
                setSelectedCards(filteredCards.map(card => card.id));
              }
            }}
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {selectedCards.length === filteredCards.length ? 'Deselect All' : 'Select All'}
          </button>
          {selectedCards.length > 0 && (
            <span className="text-xs sm:text-sm text-gray-600">
              {selectedCards.length} selected
            </span>
          )}
        </div>
      )}

      {/* Cards Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCards.map((card) => (
            <div key={card.id} className="relative">
              {/* Selection Checkbox */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedCards.includes(card.id)}
                  onChange={() => toggleCardSelection(card.id)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </div>

              <CardItem
                card={card}
                onUpdate={fetchCards}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <FiFilter className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No cards found' : 'No cards yet'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Start by scanning your first business card'}
          </p>
          {!searchTerm && (
            <a
              href="/scan"
              className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              <span>Scan First Card</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCards;
