import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Phone, Calendar, Edit, Save, X, Shield, FileText, ShoppingCart, MapPin, Building, Package } from 'lucide-react';
import { useApi } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import OrdersList from '@/components/OrdersList';
const Profile = () => {
  const { user, updateUser, fetchUserProfile, isInitializing } = useUser();
  const [editing, setEditing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    business_name: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const navigate = useNavigate();
  const api = useApi();



  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isInitializing && !user) {
      navigate('/login');
    }
  }, [user, isInitializing, navigate]);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.name || '',
        phone: user.phone || '',
        business_name: user.business_name || '',
        gstin: user.gstin || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const response = await api.put('/users/profile', {
        name: formData.full_name,
        phone: formData.phone,
        business_name: formData.business_name,
        gstin: formData.gstin,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });

      updateUser(response.data);
      await fetchUserProfile();
      setEditing(false);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to update profile',
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.name || '',
        phone: user.phone || '',
        business_name: user.business_name || '',
        gstin: user.gstin || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || ''
      });
    }
    setEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Show loading or redirect if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              {!editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-xl shadow-lg">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1">
                  {editing ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full text-lg font-semibold"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name || 'No name set'}
                    </h3>
                  )}
                  <p className="text-gray-600 text-sm mt-1">{user.email}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  {editing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.phone || 'No phone number set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Business Name */}
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Business Name</p>
                  {editing ? (
                    <Input
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      placeholder="Enter your business name"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.business_name || 'No business name set'}
                    </p>
                  )}
                </div>
              </div>

              {/* GSTIN */}
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">GSTIN</p>
                  {editing ? (
                    <Input
                      value={formData.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value)}
                      placeholder="Enter your GSTIN"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 font-mono">
                      {user.gstin || 'No GSTIN set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  {editing ? (
                    <div className="space-y-2 mt-1">
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter your address"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={2}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="City"
                        />
                        <Input
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="State"
                        />
                        <Input
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                          placeholder="Pincode"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mt-1">
                      {user.address && <p>{user.address}</p>}
                      {(user.city || user.state || user.pincode) && (
                        <p>
                          {[user.city, user.state, user.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {!user.address && !user.city && !user.state && !user.pincode && (
                        <p>No address set</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Member Since */}
              {user.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/checkout')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Cart
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/consultation')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Book Consultation
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Shield className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <User className="h-4 w-4 mr-2" />
                Two-Factor Auth
              </Button>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
