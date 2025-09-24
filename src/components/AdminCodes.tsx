import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Calendar, 
  Users,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface AdminCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  adminId: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  usedBy: string[];
  isExpired: boolean;
  isMaxUsesReached: boolean;
  canUse: boolean;
}

interface AdminCodeStats {
  totalCodes: number;
  activeCodes: number;
  expiredCodes: number;
  inactiveCodes: number;
  totalUses: number;
  averageUsesPerCode: number;
  codesWithMaxUses: number;
}

const AdminCodes: React.FC = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [stats, setStats] = useState<AdminCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<AdminCode | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    expiresAt: '',
    maxUses: '',
    isActive: true
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    expiresAt: '',
    maxUses: '',
    isActive: true
  });

  const [filter, setFilter] = useState('all'); // all, active, expired, inactive

  useEffect(() => {
    if (user) {
      fetchCodes();
      fetchStats();
    }
  }, [user, filter]);

  const fetchCodes = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const params = new URLSearchParams();
        
        if (filter === 'active') params.append('active', 'true');
        if (filter === 'expired') params.append('expired', 'true');
        
        const response = await axios.get(`/api/admin-codes?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCodes(response.data.map((code: any) => ({
          ...code,
          createdAt: new Date(code.createdAt),
          expiresAt: code.expiresAt ? new Date(code.expiresAt) : null
        })));
      }
    } catch (error) {
      console.error('Error fetching admin codes:', error);
      alert('Failed to fetch admin codes');
    }
  };

  const fetchStats = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const response = await axios.get('/api/admin-codes/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCode = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        await axios.post('/api/admin-codes/generate', {
          ...createForm,
          maxUses: createForm.maxUses ? parseInt(createForm.maxUses) : null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          description: '',
          expiresAt: '',
          maxUses: '',
          isActive: true
        });
        fetchCodes();
        fetchStats();
        alert('Admin code created successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create admin code');
    }
  };

  const updateCode = async () => {
    if (!selectedCode) return;
    
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        await axios.put(`/api/admin-codes/${selectedCode.id}`, {
          ...editForm,
          maxUses: editForm.maxUses ? parseInt(editForm.maxUses) : null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setShowEditModal(false);
        setSelectedCode(null);
        fetchCodes();
        fetchStats();
        alert('Admin code updated successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update admin code');
    }
  };

  const deleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this admin code?')) return;
    
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        await axios.delete(`/api/admin-codes/${codeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        fetchCodes();
        fetchStats();
        alert('Admin code deleted successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete admin code');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const toggleCodeVisibility = (codeId: string) => {
    const newVisible = new Set(visibleCodes);
    if (newVisible.has(codeId)) {
      newVisible.delete(codeId);
    } else {
      newVisible.add(codeId);
    }
    setVisibleCodes(newVisible);
  };

  const openEditModal = (code: AdminCode) => {
    setSelectedCode(code);
    setEditForm({
      name: code.name,
      description: code.description || '',
      expiresAt: code.expiresAt ? code.expiresAt.toISOString().split('T')[0] : '',
      maxUses: code.maxUses?.toString() || '',
      isActive: code.isActive
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (code: AdminCode) => {
    if (!code.isActive) {
      return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">Inactive</span>;
    }
    if (code.isExpired) {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">Expired</span>;
    }
    if (code.isMaxUsesReached) {
      return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm">Max Uses Reached</span>;
    }
    return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">Active</span>;
  };

  const filteredCodes = codes.filter(code => {
    if (filter === 'active') return code.canUse;
    if (filter === 'expired') return code.isExpired;
    if (filter === 'inactive') return !code.isActive;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading admin codes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Codes</h2>
          <p className="text-gray-600">Manage student signup codes for your institution</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Code</span>
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Codes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCodes}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Codes</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCodes}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Uses</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalUses}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired Codes</p>
                <p className="text-2xl font-bold text-red-600">{stats.expiredCodes}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'all', label: 'All Codes' },
          { id: 'active', label: 'Active' },
          { id: 'expired', label: 'Expired' },
          { id: 'inactive', label: 'Inactive' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Codes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Admin Codes ({filteredCodes.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredCodes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No admin codes found</p>
              <p className="text-sm">Create your first admin code to get started</p>
            </div>
          ) : (
            filteredCodes.map(code => (
              <div key={code.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{code.name}</h4>
                      {getStatusBadge(code)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {visibleCodes.has(code.id) ? code.code : '••••••••'}
                        </span>
                        <button
                          onClick={() => toggleCodeVisibility(code.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {visibleCodes.has(code.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyCode(code.code)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <span>Uses: {code.currentUses}/{code.maxUses || '∞'}</span>
                      
                      {code.expiresAt && (
                        <span>Expires: {code.expiresAt.toLocaleDateString()}</span>
                      )}
                      
                      <span>Created: {code.createdAt.toLocaleDateString()}</span>
                    </div>
                    
                    {code.description && (
                      <p className="text-gray-600 text-sm">{code.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(code)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Create Admin Code</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Fall 2024 Batch"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input
                  type="date"
                  value={createForm.expiresAt}
                  onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                <input
                  type="number"
                  value={createForm.maxUses}
                  onChange={(e) => setCreateForm({ ...createForm, maxUses: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createActive"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="createActive" className="ml-2 text-sm text-gray-700">
                  Active immediately
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCode}
                disabled={!createForm.name}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  createForm.name
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Create Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Admin Code</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input
                  type="date"
                  value={editForm.expiresAt}
                  onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                <input
                  type="number"
                  value={editForm.maxUses}
                  onChange={(e) => setEditForm({ ...editForm, maxUses: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="editActive" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateCode}
                disabled={!editForm.name}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  editForm.name
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Update Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCodes;