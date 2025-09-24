import { useState, useEffect } from 'react';
import { 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  BookOpen, 
  Users,
  MapPin,
  Calendar,
  Shield,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

interface SignupRequest {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  semester: string;
  contactNumber: string;
  dateOfBirth: string;
  address: string;
  guardianName: string;
  guardianContact: string;
  profilePictureUrl?: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

const StudentApprovals = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSignupRequests();
  }, []);

  const fetchSignupRequests = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await apiService.get('/student/signup-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRequests(response.data.map((req: any) => ({
        ...req,
        requestedAt: new Date(req.requestedAt)
      })));
    } catch (error) {
      console.error('Error fetching signup requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveStudent = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const token = await user.getIdToken();
      
      await apiService.post(`/student/approve-signup/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove the approved request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      setShowModal(false);
      alert('Student approved successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to approve student';
      alert(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectStudent = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const token = await user.getIdToken();
      
      await apiService.post(`/student/reject-signup/${requestId}`, {
        reason: rejectionReason || 'No reason provided'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove the rejected request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      setShowModal(false);
      setRejectionReason('');
      alert('Student request rejected');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to reject student';
      alert(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const openApprovalModal = (request: SignupRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Student Approval Requests
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve student signup requests
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {requests.length} Pending Requests
            </span>
          </div>
          <button
            onClick={fetchSignupRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No pending requests
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            All student signup requests have been processed.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <StudentRequestCard
              key={request.id}
              request={request}
              onApprove={openApprovalModal}
              onReject={openApprovalModal}
              isProcessing={processingId === request.id}
            />
          ))}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showModal && selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          onClose={() => setShowModal(false)}
          onApprove={approveStudent}
          onReject={rejectStudent}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          isProcessing={processingId === selectedRequest.id}
        />
      )}
    </div>
  );
};

const StudentRequestCard = ({ 
  request, 
  onApprove, 
  onReject, 
  isProcessing 
}: { 
  request: SignupRequest;
  onApprove: (request: SignupRequest) => void;
  onReject: (request: SignupRequest) => void;
  isProcessing: boolean;
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
            {request.profilePictureUrl ? (
              <img 
                src={request.profilePictureUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {request.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {request.rollNumber} • {request.department}
            </p>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {request.requestedAt.toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Semester {request.semester}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onReject(request)}
            disabled={isProcessing}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
            }`}
          >
            <XCircle className="w-4 h-4 mr-1 inline" />
            Reject
          </button>
          <button
            onClick={() => onApprove(request)}
            disabled={isProcessing}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-1 inline" />
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Mail className="w-4 h-4" />
          <span>{request.email}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Phone className="w-4 h-4" />
          <span>{request.contactNumber}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span>{request.department}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date(request.dateOfBirth).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <User className="w-4 h-4" />
          <span>{request.guardianName}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Phone className="w-4 h-4" />
          <span>{request.guardianContact}</span>
        </div>
      </div>

      {request.address && (
        <div className="mt-3 flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 mt-0.5" />
          <span>{request.address}</span>
        </div>
      )}
    </div>
  );
};

const ApprovalModal = ({ 
  request, 
  onClose, 
  onApprove, 
  onReject, 
  rejectionReason,
  setRejectionReason,
  isProcessing 
}: {
  request: SignupRequest;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  isProcessing: boolean;
}) => {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Student Request
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {request.name} • {request.rollNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Student Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{request.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Department:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{request.department}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Semester:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{request.semester}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{request.contactNumber}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Guardian:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {request.guardianName} ({request.guardianContact})
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">DOB:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {new Date(request.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
            </div>
            {request.address && (
              <div className="mt-3 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{request.address}</span>
              </div>
            )}
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="flex space-x-4">
              <button
                onClick={() => setAction('approve')}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Approve Student</span>
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <XCircle className="w-5 h-5" />
                <span>Reject Request</span>
              </button>
            </div>
          )}

          {/* Approval Form */}
          {action === 'approve' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-300">Approve Student Registration</h4>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      This will create a student account and grant access to your institution.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    !isProcessing
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {action === 'reject' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Provide a reason for rejection (optional)"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    !isProcessing
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentApprovals;