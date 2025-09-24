import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Users, BookOpen, Upload, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/apiService';

const StudentSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    department: '',
    semester: '',
    contactNumber: '',
    dateOfBirth: '',
    address: '',
    guardianName: '',
    guardianContact: '',
    adminCode: ''
  });
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{
    adminName: string;
    institutionName: string;
    codeDescription: string;
  } | null>(null);

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Biotechnology'
  ];

  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'Profile picture must be less than 5MB' });
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Only JPEG, PNG files are allowed for profile picture' });
        return;
      }
      
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyAdminCode = async () => {
    if (!formData.adminCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter admin code' });
      return;
    }

    setVerifyingCode(true);
    setMessage(null);

    try {
      const response = await apiService.post('/admin-codes/verify', {
        code: formData.adminCode
      });

      if (response.data.valid) {
        setCodeVerified(true);
        setAdminInfo({
          adminName: response.data.adminName,
          institutionName: response.data.institutionName,
          codeDescription: response.data.codeDescription
        });
        setMessage({ type: 'success', text: `Code verified! Joining ${response.data.institutionName}` });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to verify admin code';
      setMessage({ type: 'error', text: errorMessage });
      setCodeVerified(false);
      setAdminInfo(null);
    } finally {
      setVerifyingCode(false);
    }
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, rollNumber, department, semester, contactNumber, dateOfBirth, guardianName, guardianContact, adminCode } = formData;
    
    if (!adminCode.trim()) {
      setMessage({ type: 'error', text: 'Admin code is required' });
      return false;
    }
    
    if (!codeVerified) {
      setMessage({ type: 'error', text: 'Please verify your admin code first' });
      return false;
    }
    
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return false;
    }
    
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Valid email is required' });
      return false;
    }
    
    if (!password || password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return false;
    }
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return false;
    }
    
    if (!rollNumber.trim()) {
      setMessage({ type: 'error', text: 'Roll number is required' });
      return false;
    }
    
    if (!department) {
      setMessage({ type: 'error', text: 'Please select a department' });
      return false;
    }
    
    if (!semester) {
      setMessage({ type: 'error', text: 'Please select a semester' });
      return false;
    }
    
    if (!contactNumber.trim() || !/^[0-9]{10}$/.test(contactNumber)) {
      setMessage({ type: 'error', text: 'Valid 10-digit contact number is required' });
      return false;
    }
    
    if (!dateOfBirth) {
      setMessage({ type: 'error', text: 'Date of birth is required' });
      return false;
    }
    
    if (!guardianName.trim()) {
      setMessage({ type: 'error', text: 'Guardian name is required' });
      return false;
    }
    
    if (!guardianContact.trim() || !/^[0-9]{10}$/.test(guardianContact)) {
      setMessage({ type: 'error', text: 'Valid 10-digit guardian contact is required' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword') {
          submitData.append(key, formData[key as keyof typeof formData]);
        }
      });
      
      if (profilePicture) {
        submitData.append('profilePicture', profilePicture);
      }
      
      const response = await apiService.post('/student/signup', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Signup request submitted successfully! Please wait for admin approval. You will be notified via email once your account is activated.' 
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        rollNumber: '',
        department: '',
        semester: '',
        contactNumber: '',
        dateOfBirth: '',
        address: '',
        guardianName: '',
        guardianContact: '',
        adminCode: ''
      });
      setProfilePicture(null);
      setProfilePreview(null);
      setCodeVerified(false);
      setAdminInfo(null);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Signup failed. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Student Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account and wait for admin approval
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Admin Code Verification */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Institution Access Code</h3>
              <p className="text-sm text-blue-700 mb-4">
                Enter the admin code provided by your institution to register.
              </p>
              
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    name="adminCode"
                    value={formData.adminCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                    placeholder="Enter admin code (e.g., ABC123XY)"
                    disabled={codeVerified}
                  />
                </div>
                <button
                  type="button"
                  onClick={verifyAdminCode}
                  disabled={verifyingCode || codeVerified || !formData.adminCode.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    codeVerified
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : verifyingCode
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {verifyingCode ? 'Verifying...' : codeVerified ? 'Verified ✓' : 'Verify Code'}
                </button>
              </div>
              
              {adminInfo && codeVerified && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Code Verified</span>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>Institution:</strong> {adminInfo.institutionName}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Admin:</strong> {adminInfo.adminName}
                  </p>
                  {adminInfo.codeDescription && (
                    <p className="text-sm text-green-700">
                      <strong>Description:</strong> {adminInfo.codeDescription}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-indigo-100 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Upload className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Number *
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter roll number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="10-digit contact number"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            {/* Guardian Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Guardian/Parent name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Contact *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="guardianContact"
                    value={formData.guardianContact}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Guardian contact number"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
              <Link
                to="/student/login"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Already have an account? Sign in
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 border border-transparent text-sm font-medium rounded-lg text-white ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                } transition-colors duration-200`}
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentSignup;