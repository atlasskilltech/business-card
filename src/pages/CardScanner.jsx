import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiCamera, FiCheck, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { cardsAPI } from '../utils/api';
import CardEditor from '../components/CardEditor';
import Loading from '../components/Loading';

const CardScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedCard, setScannedCard] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setPreview(URL.createObjectURL(file));
    setScanning(true);

    try {
      const formData = new FormData();
      formData.append('card', file);

      const response = await cardsAPI.scanCard(formData);
      
      if (response.data.success) {
        setScannedCard(response.data.card);
        toast.success('Card scanned successfully!');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to scan card. Please try again.');
    } finally {
      setScanning(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10485760, // 10MB
    multiple: false
  });

  const handleSave = async (updatedData) => {
    try {
      await cardsAPI.updateCard(scannedCard.id, updatedData);
      setScannedCard({ ...scannedCard, ...updatedData });
      setEditing(false);
      toast.success('Card updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update card');
    }
  };

  const handleReset = () => {
    setScannedCard(null);
    setPreview(null);
    setEditing(false);
  };

  if (editing && scannedCard) {
    return (
      <div className="max-w-2xl mx-auto">
        <CardEditor
          card={scannedCard}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scan Business Card</h1>
        <p className="text-gray-600 mt-1">
          Upload a business card image to extract contact information automatically
        </p>
      </div>

      {!scannedCard ? (
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            
            {scanning ? (
              <Loading text="Scanning card with AI..." />
            ) : preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-md mx-auto rounded-lg shadow-lg"
                />
                <p className="text-gray-600">Processing...</p>
              </div>
            ) : (
              <>
                <FiUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Drop the image here' : 'Drag & drop a business card'}
                </h3>
                <p className="text-gray-600 mb-4">or click to browse</p>
                <p className="text-sm text-gray-500">
                  Supports: JPG, PNG, WEBP (Max 10MB)
                </p>
              </>
            )}
          </div>

          {/* Features */}
          <div className="bg-primary-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">What we extract:</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Name', 'Email', 'Phone', 'Company', 'Job Title', 'Website', 'Address'].map((field) => (
                <div key={field} className="flex items-center space-x-2 text-sm text-gray-700">
                  <FiCheck className="w-4 h-4 text-green-600" />
                  <span>{field}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scanned Card Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Extracted Information</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-1 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              {scannedCard.image_url && (
                <div className="md:col-span-2">
                  <img
                    src={scannedCard.image_url}
                    alt="Business card"
                    className="max-w-md mx-auto rounded-lg shadow-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{scannedCard.name || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{scannedCard.email || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{scannedCard.phone || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <p className="text-gray-900">{scannedCard.company || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <p className="text-gray-900">{scannedCard.job_title || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <p className="text-gray-900">{scannedCard.website || '-'}</p>
              </div>

              {scannedCard.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{scannedCard.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Scan Another Card
            </button>

            <button
              onClick={async () => {
                try {
                  await cardsAPI.syncCard(scannedCard.id);
                  toast.success('Card synced to Google Contacts!');
                  handleReset();
                } catch (error) {
                  toast.error('Failed to sync card');
                }
              }}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FiCamera />
              <span>Sync to Google Contacts</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardScanner;
