import { useState, useEffect } from 'react';
import { FiMail, FiSend, FiCheckSquare, FiSquare, FiEye, FiUser, FiCode, FiAlertCircle, FiCheck, FiUsers, FiFileText } from 'react-icons/fi';
import { emailAPI, cardsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';

const EmailCampaign = () => {
  const [step, setStep] = useState(1);
  const [drafts, setDrafts] = useState([]);
  const [draftContent, setDraftContent] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRecipient, setPreviewRecipient] = useState(null);
  const [showParametersHelp, setShowParametersHelp] = useState(false);

  const [campaign, setCampaign] = useState({
    name: '',
    senderName: '',
    draftId: '',
    subject: '',
    body: '',
    selectedCards: [],
    customNotes: {}
  });

  // Available parameters for email personalization
  const availableParameters = [
    { key: '{{name}}', description: 'Recipient full name', example: 'John Doe' },
    { key: '{{first_name}}', description: 'Recipient first name', example: 'John' },
    { key: '{{last_name}}', description: 'Recipient last name', example: 'Doe' },
    { key: '{{email}}', description: 'Recipient email', example: 'john@example.com' },
    { key: '{{company}}', description: 'Recipient company', example: 'Tech Corp' },
    { key: '{{job_title}}', description: 'Recipient job title', example: 'Senior Developer' },
    { key: '{{phone}}', description: 'Recipient phone', example: '+1 555-1234' },
    { key: '{{website}}', description: 'Recipient website', example: 'example.com' },
    { key: '{{custom_note}}', description: 'Personal note you add', example: 'Great meeting you!' },
    { key: '{{sender_name}}', description: 'Your name (sender)', example: 'Jane Smith' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [draftsRes, cardsRes] = await Promise.all([
        emailAPI.getDrafts(),
        cardsAPI.getCards({ limit: 100 })
      ]);

      setDrafts(draftsRes.data.drafts || []);
      
      // Only show cards with email addresses
      const cardsWithEmail = (cardsRes.data.cards || []).filter(card => card.email);
      setCards(cardsWithEmail);
      
      if (cardsWithEmail.length === 0) {
        toast.warning('No contacts with email addresses found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDraftContent = async (draftId) => {
    setLoadingDraft(true);
    try {
      const response = await emailAPI.getDraftContent(draftId);
      if (response.data.success) {
        setDraftContent({
          subject: response.data.subject,
          body: response.data.body
        });
        setCampaign(prev => ({
          ...prev,
          subject: response.data.subject,
          body: response.data.body
        }));
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft content');
      setDraftContent(null);
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleDraftSelect = async (draftId) => {
    setCampaign({ ...campaign, draftId });
    await loadDraftContent(draftId);
  };

  const insertParameter = (parameter) => {
    const textarea = document.getElementById('email-body-editor');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = campaign.body;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      setCampaign(prev => ({
        ...prev,
        body: before + parameter + after
      }));

      // Set cursor position after inserted parameter
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + parameter.length;
      }, 0);
    }
  };

  const replaceParameters = (text, recipient, customNote = '') => {
    if (!text) return '';
    
    const firstName = recipient.name ? recipient.name.split(' ')[0] : '';
    const lastName = recipient.name ? recipient.name.split(' ').slice(1).join(' ') : '';
    
    return text
      .replace(/\{\{name\}\}/g, recipient.name || '')
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{last_name\}\}/g, lastName)
      .replace(/\{\{email\}\}/g, recipient.email || '')
      .replace(/\{\{company\}\}/g, recipient.company || '')
      .replace(/\{\{job_title\}\}/g, recipient.job_title || '')
      .replace(/\{\{phone\}\}/g, recipient.phone || '')
      .replace(/\{\{website\}\}/g, recipient.website || '')
      .replace(/\{\{custom_note\}\}/g, customNote)
      .replace(/\{\{sender_name\}\}/g, campaign.senderName || '');
  };

  const getPreviewEmail = (recipient) => {
    const customNote = campaign.customNotes[recipient.id] || '';
    return {
      subject: replaceParameters(campaign.subject, recipient, customNote),
      body: replaceParameters(campaign.body, recipient, customNote)
    };
  };

  const handleSendCampaign = async () => {
    if (!campaign.name) {
      toast.error('Please enter campaign name');
      return;
    }

    if (!campaign.senderName) {
      toast.error('Please enter sender name');
      return;
    }

    if (!campaign.subject) {
      toast.error('Please enter email subject');
      return;
    }

    if (!campaign.body) {
      toast.error('Please enter email body');
      return;
    }

    if (campaign.selectedCards.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    // Final confirmation
    const confirmed = window.confirm(
      `Send campaign "${campaign.name}" to ${campaign.selectedCards.length} recipient(s)?\n\n` +
      `Sender: ${campaign.senderName}\n` +
      `Subject: ${campaign.subject}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    setSending(true);
    try {
      const response = await emailAPI.createCampaign({
        campaignName: campaign.name,
        senderName: campaign.senderName,
        draftId: campaign.draftId,
        subject: campaign.subject,
        body: campaign.body,
        cardIds: campaign.selectedCards,
        customNotes: campaign.customNotes
      });

      if (response.data.success) {
        toast.success(response.data.message);
        // Reset form
        setCampaign({
          name: '',
          senderName: '',
          draftId: '',
          subject: '',
          body: '',
          selectedCards: [],
          customNotes: {}
        });
        setDraftContent(null);
        setStep(1);
      }
    } catch (error) {
      console.error('Campaign error:', error);
      toast.error(error.response?.data?.message || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const toggleCardSelection = (cardId) => {
    setCampaign(prev => ({
      ...prev,
      selectedCards: prev.selectedCards.includes(cardId)
        ? prev.selectedCards.filter(id => id !== cardId)
        : [...prev.selectedCards, cardId]
    }));
  };

  const toggleAllCards = () => {
    if (campaign.selectedCards.length === cards.length) {
      setCampaign({ ...campaign, selectedCards: [] });
    } else {
      setCampaign({ ...campaign, selectedCards: cards.map(c => c.id) });
    }
  };

  const updateCustomNote = (cardId, note) => {
    setCampaign(prev => ({
      ...prev,
      customNotes: {
        ...prev.customNotes,
        [cardId]: note
      }
    }));
  };

  const goToNextStep = () => {
    if (step === 1) {
      if (!campaign.name) {
        toast.error('Please enter campaign name');
        return;
      }
      if (!campaign.senderName) {
        toast.error('Please enter sender name');
        return;
      }
      if (!campaign.subject) {
        toast.error('Please enter email subject');
        return;
      }
      if (!campaign.body) {
        toast.error('Please enter email body');
        return;
      }
    }
    if (step === 2 && campaign.selectedCards.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    setStep(step + 1);
  };

  if (loading) {
    return <Loading text="Loading campaigns..." />;
  }

  const selectedCardsData = cards.filter(c => campaign.selectedCards.includes(c.id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Campaign</h1>
        <p className="text-gray-600 mt-1">
          Create personalized email campaigns with dynamic parameters
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, title: 'Compose Email', icon: FiFileText },
            { num: 2, title: 'Select Recipients', icon: FiUsers },
            { num: 3, title: 'Review & Send', icon: FiCheck }
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-colors ${
                    step >= s.num
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <s.icon className="w-6 h-6" />
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  step >= s.num ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {s.title}
                </span>
              </div>
              {idx < 2 && (
                <div className="flex-1 h-1 mx-4 bg-gray-200 relative top-[-20px]">
                  <div
                    className={`h-full transition-all ${
                      step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Step 1: Compose Email */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FiFileText className="inline mr-2" />
                    Compose Your Email
                  </h2>
                  <button
                    onClick={() => setShowParametersHelp(!showParametersHelp)}
                    className="flex items-center space-x-2 px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50"
                  >
                    <FiCode />
                    <span>Parameters</span>
                  </button>
                </div>

                {/* Campaign Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={campaign.name}
                      onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                      placeholder="e.g., Monthly Newsletter - Jan 2024"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Name * 
                      <span className="text-gray-500 font-normal ml-2">(Your name)</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={campaign.senderName}
                        onChange={(e) => setCampaign({ ...campaign, senderName: e.target.value })}
                        placeholder="e.g., John Smith"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Gmail Draft Template Option */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FiMail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-2">Use Gmail Draft Template (Optional)</h4>
                      {drafts.length > 0 ? (
                        <select
                          value={campaign.draftId}
                          onChange={(e) => handleDraftSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">-- Create new email or select draft --</option>
                          {drafts.map(draft => (
                            <option key={draft.id} value={draft.id}>
                              {draft.subject || 'No Subject'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-blue-800">
                          No Gmail drafts found. You can create email from scratch below.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject * 
                    <span className="text-gray-500 font-normal ml-2">(Use {'{{'} parameters {'}}'} for personalization)</span>
                  </label>
                  <input
                    type="text"
                    value={campaign.subject}
                    onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                    placeholder="e.g., Hi {{first_name}}, let's connect!"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
                  />
                </div>

                {/* Email Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body * 
                    <span className="text-gray-500 font-normal ml-2">(HTML supported)</span>
                  </label>
                  <textarea
                    id="email-body-editor"
                    value={campaign.body}
                    onChange={(e) => setCampaign({ ...campaign, body: e.target.value })}
                    placeholder={`Hi {{first_name}},\n\nIt was great meeting you at {{company}}. I'd love to continue our conversation about...\n\n{{custom_note}}\n\nBest regards,\n{{sender_name}}`}
                    rows="12"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: Click parameter buttons on the right to insert them at cursor position
                  </p>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <button
                    onClick={() => {
                      const sample = cards[0];
                      if (sample) {
                        setPreviewRecipient(sample);
                        setShowPreview(true);
                      } else {
                        toast.warning('Add contacts first to preview');
                      }
                    }}
                    className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <FiEye />
                    <span>Preview Email</span>
                  </button>

                  <button
                    onClick={goToNextStep}
                    disabled={!campaign.name || !campaign.senderName || !campaign.subject || !campaign.body}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next: Select Recipients</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Recipients */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <FiUsers className="inline mr-2" />
                      Select Recipients
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {campaign.selectedCards.length} of {cards.length} recipient{cards.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <button
                    onClick={toggleAllCards}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {campaign.selectedCards.length === cards.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {cards.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {cards.map((card) => {
                      const isSelected = campaign.selectedCards.includes(card.id);
                      return (
                        <div
                          key={card.id}
                          className={`border-2 rounded-lg transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            onClick={() => toggleCardSelection(card.id)}
                            className="p-4 cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="pt-0.5">
                                {isSelected ? (
                                  <FiCheckSquare className="w-5 h-5 text-primary-600" />
                                ) : (
                                  <FiSquare className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">
                                  {card.name || 'Unknown'}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  📧 {card.email}
                                </p>
                                {(card.company || card.job_title) && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {[card.job_title, card.company].filter(Boolean).join(' at ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Custom Note for Selected Recipients */}
                          {isSelected && (
                            <div className="px-4 pb-4 border-t border-primary-200 pt-3 bg-white">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Personal Note for {card.name?.split(' ')[0] || 'this recipient'}
                                <span className="text-gray-500 font-normal ml-2">(Will replace {'{{'} custom_note {'}}'} )</span>
                              </label>
                              <textarea
                                value={campaign.customNotes[card.id] || ''}
                                onChange={(e) => updateCustomNote(card.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Add a personalized message specifically for this recipient..."
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Contacts with Email
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Add contacts with email addresses to send campaigns
                    </p>
                    <a
                      href="/scan"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <span>Scan Business Cards</span>
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={goToNextStep}
                    disabled={campaign.selectedCards.length === 0}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Review & Send
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Send */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FiCheck className="inline mr-2" />
                  Review Campaign
                </h2>

                {/* Campaign Summary */}
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 space-y-3 border border-primary-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Campaign:</span>
                      <p className="text-lg font-semibold text-gray-900">{campaign.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Sender:</span>
                      <p className="text-lg font-semibold text-gray-900">{campaign.senderName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Subject:</span>
                      <p className="font-medium text-gray-900">{campaign.subject}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Recipients:</span>
                      <p className="font-medium text-gray-900">
                        {campaign.selectedCards.length} contact{campaign.selectedCards.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recipients Preview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                    <span>Recipients ({selectedCardsData.length}):</span>
                    <button
                      onClick={() => {
                        if (selectedCardsData.length > 0) {
                          setPreviewRecipient(selectedCardsData[0]);
                          setShowPreview(true);
                        }
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-normal flex items-center space-x-1"
                    >
                      <FiEye className="w-4 h-4" />
                      <span>Preview First Email</span>
                    </button>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg p-4">
                    {selectedCardsData.map((card, index) => (
                      <div key={card.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm font-medium text-gray-500 min-w-[30px]">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{card.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">📧 {card.email}</p>
                          {campaign.customNotes[card.id] && (
                            <p className="text-sm text-primary-600 mt-1 bg-primary-50 p-2 rounded">
                              💬 Note: {campaign.customNotes[card.id]}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setPreviewRecipient(card);
                            setShowPreview(true);
                          }}
                          className="text-primary-600 hover:text-primary-700"
                          title="Preview email for this recipient"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex items-start space-x-3">
                    <FiAlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important - Please Review</h4>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Each recipient will receive a <strong>personalized email</strong> with their specific data</li>
                        <li>Parameters like {'{{'} name {'}}'} and {'{{'} company {'}}'} will be automatically replaced</li>
                        <li>Emails will be sent <strong>immediately</strong> and <strong>cannot be recalled</strong></li>
                        <li>Verify all recipient email addresses are correct</li>
                        <li>Preview individual emails using the 👁️ icon</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ← Back to Recipients
                  </button>
                  <button
                    onClick={handleSendCampaign}
                    disabled={sending}
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 font-semibold shadow-lg"
                  >
                    <FiSend className="w-5 h-5" />
                    <span>{sending ? 'Sending Campaign...' : `Send to ${campaign.selectedCards.length} Recipients`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Parameters Guide */}
        {step === 1 && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FiCode className="mr-2" />
                  Email Parameters
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Click any parameter to insert it at your cursor position. It will be replaced with actual data for each recipient.
              </p>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {availableParameters.map((param) => (
                  <button
                    key={param.key}
                    onClick={() => insertParameter(param.key)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <code className="text-sm font-mono text-primary-600 font-semibold">
                          {param.key}
                        </code>
                        <p className="text-xs text-gray-600 mt-1">{param.description}</p>
                        <p className="text-xs text-gray-400 mt-1 italic">
                          e.g., "{param.example}"
                        </p>
                      </div>
                      <span className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        +
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>💡 Pro Tip:</strong> Use parameters in both subject and body for maximum personalization!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {showPreview && previewRecipient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary-600 to-blue-600 text-white">
              <div>
                <h3 className="text-xl font-semibold">Email Preview</h3>
                <p className="text-sm opacity-90 mt-1">
                  How {previewRecipient.name || 'this recipient'} will see the email
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Gmail-like Header */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">From:</span>
                    <span className="text-sm text-gray-900">{campaign.senderName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">To:</span>
                    <span className="text-sm text-gray-900">
                      {previewRecipient.name} &lt;{previewRecipient.email}&gt;
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Subject:</span>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {getPreviewEmail(previewRecipient).subject}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: getPreviewEmail(previewRecipient).body.replace(/\n/g, '<br>') 
                  }} 
                  className="prose max-w-none text-gray-800"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ All parameters have been replaced with actual data from this recipient's contact card.
                </p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowPreview(false)}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaign;