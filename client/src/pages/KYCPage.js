import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import countries from '../utils/countries';
import Webcam from 'react-webcam';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiCamera, FiUpload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const KYCPage = () => {
  const [step, setStep] = useState(1); // 1: Info, 2: ID, 3: Selfie, 4: Review
  const [country, setCountry] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [idFrontFile, setIdFrontFile] = useState(null);
  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackFile, setIdBackFile] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [useIdFrontCamera, setUseIdFrontCamera] = useState(false);
  const [useIdBackCamera, setUseIdBackCamera] = useState(false);
  const webcamRef = useRef(null);
  const idFrontWebcamRef = useRef(null);
  const idBackWebcamRef = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchKYC = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/kyc/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKycStatus(res.data.kyc.status || 'pending');
        setRejectionReason(res.data.kyc.rejectionReason || '');
      } catch {
        setKycStatus('pending');
        setRejectionReason('');
      }
    };
    fetchKYC();
  }, [success]);

  // Preview for ID front file
  useEffect(() => {
    if (idFrontFile) {
      const reader = new FileReader();
      reader.onloadend = () => setIdFrontPreview(reader.result);
      reader.readAsDataURL(idFrontFile);
    } else {
      setIdFrontPreview(null);
    }
  }, [idFrontFile]);

  // Preview for ID back file
  useEffect(() => {
    if (idBackFile) {
      const reader = new FileReader();
      reader.onloadend = () => setIdBackPreview(reader.result);
      reader.readAsDataURL(idBackFile);
    } else {
      setIdBackPreview(null);
    }
  }, [idBackFile]);

  // Preview for selfie file
  useEffect(() => {
    if (selfieFile) {
      const reader = new FileReader();
      reader.onloadend = () => setSelfiePreview(reader.result);
      reader.readAsDataURL(selfieFile);
    } else {
      setSelfiePreview(null);
    }
  }, [selfieFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!country || !documentType || !selfieFile) {
      setError('All fields are required.');
      toast.error('All fields are required.');
      return;
    }
    // For types needing both front and back
    const needsBack = ['National ID', "Driver's License", 'Residence Permit', 'Voter Card', 'Other (Front & Back)'].includes(documentType);
    if (!idFrontFile || (needsBack && !idBackFile)) {
      setError('Please upload all required ID images.');
      toast.error('Please upload all required ID images.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('country', country);
    formData.append('documentType', documentType);
    formData.append('idFront', idFrontFile);
    if (needsBack) formData.append('idBack', idBackFile);
    formData.append('selfie', selfieFile);
    try {
      await axios.post('/api/auth/kyc/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSuccess(true);
      setKycStatus('pending');
      setRejectionReason('');
      toast.success('KYC submitted! Under review.');
    } catch (err) {
      setError('Failed to upload KYC.');
      toast.error('Failed to upload KYC.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          setSelfieFile(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
          setUseCamera(false);
        });
    }
  };

  const handleIdFrontCapture = () => {
    if (idFrontWebcamRef.current) {
      const imageSrc = idFrontWebcamRef.current.getScreenshot();
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          setIdFrontFile(new File([blob], 'id-front.jpg', { type: 'image/jpeg' }));
          setUseIdFrontCamera(false);
        });
    }
  };

  const handleIdBackCapture = () => {
    if (idBackWebcamRef.current) {
      const imageSrc = idBackWebcamRef.current.getScreenshot();
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          setIdBackFile(new File([blob], 'id-back.jpg', { type: 'image/jpeg' }));
          setUseIdBackCamera(false);
        });
    }
  };

  // Status banners
  if (success || kycStatus === 'pending') {
    return (
      <div className="max-w-md w-full mx-auto p-4 sm:p-8 glassmorphic rounded-xl mt-6 sm:mt-10 text-center overflow-auto">
        <ToastContainer />
        <FiAlertCircle className="mx-auto text-yellow-400 text-4xl mb-2" />
        <h2 className="text-2xl font-bold mb-4 text-gold">KYC Verification</h2>
        <div className="text-yellow-400 font-bold">KYC Submitted! Under Review</div>
      </div>
    );
  }
  if (kycStatus === 'verified') {
    return (
      <div className="max-w-md w-full mx-auto p-4 sm:p-8 glassmorphic rounded-xl mt-6 sm:mt-10 text-center overflow-auto">
        <ToastContainer />
        <FiCheckCircle className="mx-auto text-green-400 text-4xl mb-2" />
        <h2 className="text-2xl font-bold mb-4 text-gold">KYC Verification</h2>
        <div className="text-green-400 font-bold">KYC Verified! Enjoy full access.</div>
      </div>
    );
  }
  if (kycStatus === 'rejected') {
    return (
      <div className="max-w-md w-full mx-auto p-4 sm:p-8 glassmorphic rounded-xl mt-6 sm:mt-10 text-center overflow-auto">
        <ToastContainer />
        <FiAlertCircle className="mx-auto text-red-400 text-4xl mb-2" />
        <h2 className="text-2xl font-bold mb-4 text-gold">KYC Verification</h2>
        <div className="text-red-400 font-bold mb-4">KYC Rejected. {rejectionReason && <span>Reason: {rejectionReason}</span>}</div>
        {/* Show the form again for resubmission */}
        {renderKYCForm()}
      </div>
    );
  }

  // Stepper UI
  const steps = [
    { label: 'Personal Info' },
    { label: 'ID Document' },
    { label: 'Selfie' },
    { label: 'Review & Submit' }
  ];

  function renderStepper() {
    return (
      <div className="flex justify-between mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg mb-1 border-2 ${step > i+1 ? 'bg-gold text-black border-gold' : step === i+1 ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>{i+1}</div>
            <span className={`text-xs ${step === i+1 ? 'text-yellow-400' : 'text-gray-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderKYCForm() {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div>
            <label className="block text-gray-300 mb-1">Country</label>
            <select value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white mb-4">
              <option value="">Select country</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="block text-gray-300 mb-1">Document Type</label>
            <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white">
              <option value="">Select document type</option>
              <option value="Passport">Passport</option>
              <option value="National ID">National ID</option>
              <option value="Driver's License">Driver's License</option>
              <option value="Residence Permit">Residence Permit</option>
              <option value="Voter Card">Voter Card</option>
              <option value="Military ID">Military ID</option>
              <option value="Tax ID">Tax ID</option>
              <option value="Social Security Card">Social Security Card</option>
              <option value="Other (Front & Back)">Other (Front & Back)</option>
              <option value="Other (Single Side)">Other (Single Side)</option>
            </select>
            <button type="button" className="mt-6 bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition w-full" disabled={!country || !documentType} onClick={() => setStep(2)}>Next</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="block text-gray-300 mb-1">ID Document</label>
            {/* Front side upload/capture */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <span className="text-gray-400 text-xs mb-1">{['Passport','Other (Single Side)'].includes(documentType) ? 'Upload document image' : 'Upload front side'}</span>
              {idFrontPreview ? (
                <img src={idFrontPreview} alt="ID Front Preview" className="w-48 h-32 object-contain rounded border border-gray-700 mb-2" />
              ) : (
                <div className="w-48 h-32 flex items-center justify-center bg-gray-800 rounded border border-gray-700 mb-2 text-gray-500">No file selected</div>
              )}
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                  <FiUpload /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => setIdFrontFile(e.target.files[0])} />
                </label>
                <button type="button" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onClick={() => setUseIdFrontCamera(true)}>
                  <FiCamera /> Snap
                </button>
              </div>
              {useIdFrontCamera && (
                <div className="mt-4 flex flex-col items-center">
                  <Webcam
                    audio={false}
                    ref={idFrontWebcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded border-2 border-gold w-48 h-32 object-contain mb-2"
                  />
                  <button type="button" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition mt-2" onClick={handleIdFrontCapture}>Capture</button>
                  <button type="button" className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg mt-2" onClick={() => setUseIdFrontCamera(false)}>Cancel</button>
                </div>
              )}
            </div>
            {/* Back side upload/capture if needed */}
            {['National ID',"Driver's License",'Residence Permit','Voter Card','Other (Front & Back)'].includes(documentType) && (
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="text-gray-400 text-xs mb-1">Upload back side</span>
                {idBackPreview ? (
                  <img src={idBackPreview} alt="ID Back Preview" className="w-48 h-32 object-contain rounded border border-gray-700 mb-2" />
                ) : (
                  <div className="w-48 h-32 flex items-center justify-center bg-gray-800 rounded border border-gray-700 mb-2 text-gray-500">No file selected</div>
                )}
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                    <FiUpload /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={e => setIdBackFile(e.target.files[0])} />
                  </label>
                  <button type="button" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onClick={() => setUseIdBackCamera(true)}>
                    <FiCamera /> Snap
                  </button>
                </div>
                {useIdBackCamera && (
                  <div className="mt-4 flex flex-col items-center">
                    <Webcam
                      audio={false}
                      ref={idBackWebcamRef}
                      screenshotFormat="image/jpeg"
                      className="rounded border-2 border-gold w-48 h-32 object-contain mb-2"
                    />
                    <button type="button" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition mt-2" onClick={handleIdBackCapture}>Capture</button>
                    <button type="button" className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg mt-2" onClick={() => setUseIdBackCamera(false)}>Cancel</button>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button type="button" className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition" disabled={!idFrontFile || (['National ID',"Driver's License",'Residence Permit','Voter Card','Other (Front & Back)'].includes(documentType) && !idBackFile)} onClick={() => setStep(3)}>Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <label className="block text-gray-300 mb-1">Selfie</label>
            <div className="flex flex-col items-center gap-2">
              {selfiePreview ? (
                <img src={selfiePreview} alt="Selfie Preview" className="w-32 h-32 object-cover rounded-full border-2 border-gold mb-2" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-800 rounded-full border-2 border-gray-700 mb-2 text-gray-500">No selfie</div>
              )}
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                  <FiUpload /> Upload Selfie
                  <input type="file" accept="image/*" className="hidden" onChange={e => setSelfieFile(e.target.files[0])} />
                </label>
                <button type="button" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onClick={() => setUseCamera(true)}>
                  <FiCamera /> Take Selfie
                </button>
              </div>
              {useCamera && (
                <div className="mt-4 flex flex-col items-center">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-full border-2 border-gold w-32 h-32 object-cover mb-2"
                  />
                  <button type="button" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition mt-2" onClick={handleCapture}>Capture</button>
                  <button type="button" className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg mt-2" onClick={() => setUseCamera(false)}>Cancel</button>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button type="button" className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg" onClick={() => setStep(2)}>Back</button>
              <button type="button" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition" disabled={!selfieFile} onClick={() => setStep(4)}>Next</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <h3 className="text-lg font-bold mb-2 text-gold">Review & Submit</h3>
            <div className="mb-4">
              <div className="mb-2"><span className="font-semibold text-gray-300">Country:</span> <span className="text-white">{country}</span></div>
              <div className="mb-2 flex items-center gap-2"><span className="font-semibold text-gray-300">ID Front:</span> {idFrontPreview && <img src={idFrontPreview} alt="ID Front Preview" className="w-24 h-16 object-contain rounded border border-gray-700" />}</div>
              {['National ID',"Driver's License",'Residence Permit','Voter Card','Other (Front & Back)'].includes(documentType) && (
                <div className="mb-2 flex items-center gap-2"><span className="font-semibold text-gray-300">ID Back:</span> {idBackPreview && <img src={idBackPreview} alt="ID Back Preview" className="w-24 h-16 object-contain rounded border border-gray-700" />}</div>
              )}
              <div className="mb-2 flex items-center gap-2"><span className="font-semibold text-gray-300">Selfie:</span> {selfiePreview && <img src={selfiePreview} alt="Selfie Preview" className="w-16 h-16 object-cover rounded-full border-2 border-gold" />}</div>
            </div>
            {error && <div className="text-red-400 mb-2">{error}</div>}
            <div className="flex justify-between">
              <button type="button" className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg" onClick={() => setStep(3)}>Back</button>
              <button type="submit" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition" disabled={loading}>{loading ? 'Submitting...' : 'Submit KYC'}</button>
            </div>
          </div>
        )}
      </form>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 glassmorphic rounded-xl mt-10">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-4 text-gold text-center">KYC Verification</h2>
      {renderStepper()}
      {renderKYCForm()}
    </div>
  );
};

export default KYCPage;
