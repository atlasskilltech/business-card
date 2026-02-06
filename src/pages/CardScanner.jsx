import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiCamera, FiCheck, FiEdit2, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { cardsAPI } from '../utils/api';
import CardEditor from '../components/CardEditor';
import Loading from '../components/Loading';

const CardScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedCard, setScannedCard] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const cameraInputRef = useRef(null);

  const processImage = async (file) => {
    console.log('Processing image:', file.name, file.type, file.size);
    
    // Validate file
    if (!file) {
      toast.error('No file selected');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10485760) {
      toast.error('Image too large. Max 10MB');
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setScanning(true);

    try {
      console.log('Creating FormData...');
      const formData = new FormData();
      formData.append('card', file);

      console.log('Sending to API...');
      const response = await cardsAPI.scanCard(formData);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        setScannedCard(response.data.card);
        toast.success('Card scanned successfully!');
        console.log('Scanned card:', response.data.card);
      } else {
        throw new Error(response.data.message || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to scan card';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Clear preview on error
      setPreview(null);
    } finally {
      setScanning(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    console.log('Files dropped:', acceptedFiles.length, 'accepted', rejectedFiles.length, 'rejected');
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      console.error('File rejected:', rejection);
      
      if (rejection.errors[0]?.code === 'file-too-large') {
        toast.error('Image too large. Max 10MB');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        toast.error('Invalid file type. Use JPG, PNG, or WEBP');
      } else {
        toast.error('File rejected: ' + rejection.errors[0]?.message);
      }
      return;
    }

    if (acceptedFiles.length === 0) {
      console.warn('No files accepted');
      return;
    }

    await processImage(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10485760, // 10MB
    multiple: false,
    noClick: false,
    noKeyboard: false
  });

  const handleCameraCapture = async (event) => {
    console.log('Camera capture triggered');
    const file = event.target.files?.[0];
    
    if (!file) {
      console.warn('No file selected from camera');
      return;
    }

    console.log('Camera file selected:', file.name, file.type, file.size);
    await processImage(file);
    
    // Reset input to allow same file again
    event.target.value = '';
  };

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
    setError(null);
  };

  if (editing && scannedCard) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <CardEditor
          card={scannedCard}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Scan Business Card</h1>
        <p className="text-sm lg:text-base text-gray-600 mt-1">
          Upload a business card image or take a photo to extract contact information
        </p>
      </div>

      {!scannedCard ? (
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 lg:p-12 text-center cursor-pointer transition-colors ${
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
                  className="max-w-full lg:max-w-md mx-auto rounded-lg shadow-lg"
                />
                <p className="text-gray-600">Processing...</p>
              </div>
            ) : (
              <>
                <FiUpload className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Drop the image here' : 'Drag & drop a business card'}
                </h3>
                <p className="text-sm lg:text-base text-gray-600 mb-2">or click to browse</p>
                <p className="text-xs lg:text-sm text-gray-500">
                  Supports: JPG, PNG, WEBP (Max 10MB)
                </p>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && !scanning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Upload Failed</h4>
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium mt-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Camera Capture Button */}
          {!scanning && !preview && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <div className="h-px flex-1 bg-gray-300"></div>
                <span className="text-gray-400 font-medium">OR</span>
                <div className="h-px flex-1 bg-gray-300"></div>
              </div>
              
              <div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                  id="camera-input"
                />
                <label
                  htmlFor="camera-input"
                  className="inline-flex items-center justify-center space-x-2 px-6 lg:px-8 py-3 lg:py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors cursor-pointer shadow-lg w-full sm:w-auto"
                >
                  <FiCamera className="w-5 h-5 lg:w-6 lg:h-6" />
                  <span className="text-base lg:text-lg font-medium">Take Photo with Camera</span>
                </label>
                <p className="text-xs lg:text-sm text-gray-500 mt-3">
                  📱 On mobile: Opens your camera directly
                </p>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="bg-primary-50 rounded-lg p-4 lg:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
              ✨ What we extract:
            </h3>
            <div className="grid grid-cols-2 gap-2 lg:gap-3">
              {['Name', 'Email', 'Phone', 'Company', 'Job Title', 'Website', 'Address'].map((field) => (
                <div key={field} className="flex items-center space-x-2 text-xs lg:text-sm text-gray-700">
                  <FiCheck className="w-3 h-3 lg:w-4 lg:h-4 text-green-600 flex-shrink-0" />
                  <span>{field}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips for Mobile Users */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm lg:text-base">
              📸 Tips for Best Results:
            </h4>
            <ul className="text-xs lg:text-sm text-blue-800 space-y-1">
              <li>• Use good lighting (avoid shadows)</li>
              <li>• Keep card flat and fully visible</li>
              <li>• Ensure text is clear and not blurry</li>
              <li>• Fill the frame with the card</li>
              <li>• Avoid reflections if card is glossy</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scanned Card Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-start justify-between mb-4 lg:mb-6">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Extracted Information</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-1 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm lg:text-base"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Image */}
              {scannedCard.image_url && (
                <div className="md:col-span-2">
                  <img
                    src={scannedCard.image_url}
                    alt="Business card"
                    className="max-w-full lg:max-w-md mx-auto rounded-lg shadow-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Fields */}
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm lg:text-base text-gray-900">{scannedCard.name || '-'}</p>
              </div>

              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm lg:text-base text-gray-900 break-all">{scannedCard.email || '-'}</p>
              </div>

              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-sm lg:text-base text-gray-900">{scannedCard.phone || '-'}</p>
              </div>

              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Company</label>
                <p className="text-sm lg:text-base text-gray-900">{scannedCard.company || '-'}</p>
              </div>

              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <p className="text-sm lg:text-base text-gray-900">{scannedCard.job_title || '-'}</p>
              </div>

              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Website</label>
                <p className="text-sm lg:text-base text-gray-900 break-all">{scannedCard.website || '-'}</p>
              </div>

              {scannedCard.address && (
                <div className="md:col-span-2">
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-sm lg:text-base text-gray-900">{scannedCard.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 lg:gap-4">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm lg:text-base"
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
                  console.error('Sync error:', error);
                  toast.error(error.response?.data?.message || 'Failed to sync card');
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 lg:px-6 py-2 lg:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg text-sm lg:text-base"
            >
              <FiCheck className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>Sync to Google Contacts</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardScanner;
