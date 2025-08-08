// src/pages/Register.js
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import countries from '../utils/countries';

// Defensive helper to render only strings
function SafeString({ value }) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return null;
}

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const AUTH_PATH = `${API_BASE_URL}/api/auth`;

  // Get referral code from ?ref= query param
  const searchParams = new URLSearchParams(location.search);
  const referralFromUrl = searchParams.get('ref') || '';

  const formik = useFormik({
    initialValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      country: '',
      securityQuestion: '',
      securityAnswer: '',
      password: '',
      confirmPassword: '',
      referralCode: referralFromUrl,
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('Required'),
      username: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email').required('Required'),
      phone: Yup.string().required('Required'),
      country: Yup.string().required('Required'),
      securityQuestion: Yup.string().required('Required'),
      securityAnswer: Yup.string().required('Required'),
      password: Yup.string().min(8, 'Must be at least 8 characters').required('Required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Required'),
      referralCode: Yup.string(),
    }),
    onSubmit: async (values) => {
      const registrationPayload = {
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        phone: values.phone,
        country: values.country,
        securityQuestion: values.securityQuestion,
        securityAnswer: values.securityAnswer,
        password: values.password,
        referralCode: values.referralCode,
      };
      console.log('Registration data being sent:', registrationPayload);
      try {
        await axios.post(`${AUTH_PATH}/register`, registrationPayload);
        // Registration successful, show verification modal
        setRegisteredEmail(values.email);
        setShowVerifyModal(true);
      } catch (error) {
        console.error('Registration error:', error);
        if (error.response) {
          console.error('Backend response:', error.response.data);
          if (error.response.data && error.response.data.message === 'User already exists') {
            alert('An account with this email or username already exists. Please log in or use a different email.');
          } else {
            alert(error.response.data.message || 'Registration failed. Please try again.');
          }
        } else {
          alert('Registration failed. Please check your network connection.');
        }
      }
    },
  });

  return (
    <React.Fragment>
      <div className="min-h-screen flex items-center justify-center bg-dark p-2 sm:p-4">
        <div className="glassmorphic p-4 sm:p-8 rounded-xl w-full max-w-2xl">
          {/* ...Logo and other UI... */}
          <>
            <h2 className="text-2xl text-gold mb-6">Create Your Account</h2>
            <form onSubmit={formik.handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4 w-full">
                <div>
                  <label htmlFor="register-fullName" className="block mb-2">Full Name</label>
                  <input
                    id="register-fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.fullName}
                    className="w-full bg-dark border border-gray-700 rounded p-2 sm:p-3"
                  />
                  {formik.touched.fullName && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.fullName} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-username" className="block mb-2">Username</label>
                  <input
                    id="register-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.username}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  />
                  {formik.touched.username && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.username} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-email" className="block mb-2">Email</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  />
                  {formik.touched.email && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.email} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-phone" className="block mb-2">Phone</label>
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.phone}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  />
                  {formik.touched.phone && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.phone} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-country" className="block mb-2">Country</label>
                  <select
                    id="register-country"
                    name="country"
                    autoComplete="country"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.country}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  >
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formik.touched.country && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.country} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-securityQuestion" className="block mb-2">Security Question</label>
                  <select
                    id="register-securityQuestion"
                    name="securityQuestion"
                    autoComplete="security-question"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.securityQuestion}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  >
                    <option value="">Select a question</option>
                    <option value="pet">What is the name of your first pet?</option>
                    <option value="school">What is the name of your elementary school?</option>
                    <option value="city">In what city were you born?</option>
                    <option value="mother">What is your mother's maiden name?</option>
                    {/* Add more questions as needed */}
                  </select>
                  {formik.touched.securityQuestion && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.securityQuestion} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-securityAnswer" className="block mb-2">Security Answer</label>
                  <input
                    id="register-securityAnswer"
                    name="securityAnswer"
                    type="text"
                    autoComplete="security-answer"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.securityAnswer}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  />
                  {formik.touched.securityAnswer && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.securityAnswer} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-password" className="block mb-2">Password</label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  />
                  {formik.touched.password && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.password} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-confirmPassword" className="block mb-2">Confirm Password</label>
                  <input
                    id="register-confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.confirmPassword}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  />
                  {formik.touched.confirmPassword && (
                    <div className="text-red-500 text-sm"><SafeString value={formik.errors.confirmPassword} /></div>
                  )}
                </div>
                <div>
                  <label htmlFor="register-referralCode" className="block mb-2">Referral Code (optional)</label>
                  <input
                    id="register-referralCode"
                    name="referralCode"
                    type="text"
                    autoComplete="off"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.referralCode}
                    className="w-full bg-dark border border-gray-700 rounded p-3"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gold text-black font-bold py-3 rounded hover:bg-yellow-600 transition"
              >
                Register
              </button>
            </form>
            <div className="mt-4 text-center">
              Already have an account?{' '}
              <a href="/login" className="text-gold hover:underline">Sign in</a>
            </div>
          </>
        </div>
      </div>
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-md relative text-center">
            <h2 className="text-xl font-bold mb-4 text-gold">Verify Your Email</h2>
            <p className="mb-4 text-white">
              A verification link and OTP have been sent to <span className="font-bold">{registeredEmail}</span>.<br/>
              Please check your inbox and follow the instructions to verify your email address.<br/>
              <span className="text-sm text-gray-400">(You can enter the OTP below if you prefer)</span>
            </p>
            <button
              className="mb-4 text-gold underline text-sm"
              type="button"
              disabled={isVerifying || otpSuccess}
              onClick={async () => {
                setOtpError("");
                try {
                  await axios.post(`${AUTH_PATH}/resend-otp`, { email: registeredEmail });
                  setOtpError("A new OTP has been sent to your email.");
                } catch (err) {
                  setOtpError(err.response?.data?.message || "Failed to resend OTP.");
                }
              }}
            >
              Resend OTP
            </button>
            {otpSuccess ? (
              <div className="mb-4 text-green-400 font-bold">Email verified! You can now log in.</div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsVerifying(true);
                  setOtpError("");
                  try {
                    await axios.post(`${AUTH_PATH}/verify-otp`, {
                      email: registeredEmail,
                      otp,
                    });
                    setOtpSuccess(true);
                    setTimeout(() => {
                      setShowVerifyModal(false);
                      navigate("/login");
                    }, 1500);
                  } catch (err) {
                    setOtpError(
                      err.response?.data?.message || "Verification failed. Please try again."
                    );
                  } finally {
                    setIsVerifying(false);
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-dark border border-gray-700 rounded p-3 mb-2 text-center text-lg tracking-widest"
                  maxLength={6}
                  autoFocus
                  disabled={isVerifying || otpSuccess}
                />
                {otpError && <div className="text-red-400 mb-2">{otpError}</div>}
                <button
                  type="submit"
                  className="w-full bg-gold text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
                  disabled={isVerifying || otpSuccess}
                >
                  {isVerifying ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            )}
            <button
              className="mt-4 bg-gray-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-600 transition"
              onClick={() => navigate("/login")}
              disabled={isVerifying}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default Register;