// src/contexts/AdminContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useUser } from './UserContext';
interface DashboardStats {
  overview: {
    totalOrders: number;
    totalUsers: number;
    totalServices: number;
    totalRevenue: number;
    pendingRevenue: number;
    completedOrders: number;
  };
  ordersByStatus: Array<{ _id: string; count: number }>;
  latestOrders: any[];
  monthlyRevenue: Array<{ _id: number; revenue: number; orders: number }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  business_name?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  userId: any;
  orderNumber: string;
  items: any[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    businessName?: string;
    gstin?: string;
  };
  pricing: {
    subtotal: number;
    gstRate: number;
    gstAmount: number;
    discount: number;
    shipping: number;
    total: number;
  };
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  estimateDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalUsers?: number;
  totalOrders?: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AdminContextType {
  // Dashboard Stats
  dashboardStats: DashboardStats | null;
  fetchDashboardStats: () => Promise<void>;
  loadingStats: boolean;

  // User Management
  users: User[];
  usersPagination: Pagination | null;
  fetchUsers: (page?: number, search?: string, role?: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  loadingUsers: boolean;

  // Order Management
  orders: Order[];
  ordersPagination: Pagination | null;
  fetchOrders: (page?: number, orderStatus?: string, paymentStatus?: string, search?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, orderStatus: string) => Promise<void>;
  loadingOrders: boolean;

  // Analytics
  revenueStats: any;
  ordersAnalytics: any;
  usersAnalytics: any;
  fetchRevenueStats: (startDate?: string, endDate?: string) => Promise<void>;
  fetchOrdersAnalytics: () => Promise<void>;
  fetchUsersAnalytics: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const api = useApi();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  // Dashboard State
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPagination, setOrdersPagination] = useState<Pagination | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Analytics State
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [ordersAnalytics, setOrdersAnalytics] = useState<any>(null);
  const [usersAnalytics, setUsersAnalytics] = useState<any>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      logout();
      navigate('/login', { replace: true });
    }
  }, []);

  // ✅ Helper function to handle authentication errors
  const handleAuthError = (error: any) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    // Check for authentication errors
    if (
      status === 401 ||
      status === 403 ||
      message?.toLowerCase().includes('token') ||
      message?.toLowerCase().includes('unauthorized') ||
      message?.toLowerCase().includes('not authorized')
    ) {
      // Logout user
      logout();
      // Clear token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Show error toast
      toast({
        title: 'Session Expired',
        description: 'Please login again to continue',
        variant: 'destructive',
      });
      // Redirect to login after 1 second
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
      return true; // Auth error handled
    }
    return false; // Not an auth error
  };

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const response = await api.get('/dashboard/stats');
      setDashboardStats(response.data);
    } catch (error: any) {
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard statistics',
        variant: 'destructive',
      });
    } finally {
      setLoadingStats(false);
    }
  };


  // Fetch Users
  const fetchUsers = async (page: number = 1, search?: string, role?: string) => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (role) params.append('role', role);
      const response = await api.get(`/users/all?${params.toString()}`);
      setUsers(response.data?.users || []);
      setUsersPagination(response.data?.pagination || null);
    } catch (error: any) {
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      setUsers([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Delete User
  const deleteUser = async (userId: string) => {
    try {
      await api.del(`/users/${userId}`);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      // Refresh users list
      await fetchUsers(usersPagination?.currentPage || 1);
      await fetchDashboardStats();
      await fetchUsersAnalytics();
    } catch (error: any) {
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  // Fetch Orders
  const fetchOrders = async (
    page: number = 1,
    orderStatus?: string,
    paymentStatus?: string,
    search?: string
  ) => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (orderStatus && orderStatus !== '') params.append('orderStatus', orderStatus);
      if (paymentStatus && paymentStatus !== '') params.append('paymentStatus', paymentStatus);
      if (search && search !== '') params.append('search', search);
      const response = await api.get(`/orders/all?${params.toString()}`);
      setOrders(response.data?.orders || []);
      setOrdersPagination(response.data?.pagination || null);
    } catch (error: any) {
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      setOrders([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  // Update Order Status
  const updateOrderStatus = async (orderId: string, orderStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus });
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });
      // Refresh orders
      await fetchOrders(ordersPagination?.currentPage || 1);
      // ✅ IMPORTANT: Refresh dashboard stats immediately
      await fetchDashboardStats();

      // ✅ Refresh all analytics
      await fetchRevenueStats();
      await fetchOrdersAnalytics();
    } catch (error: any) {
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };
  // Fetch Revenue Stats
  const fetchRevenueStats = async (startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await api.get(`/dashboard/revenue?${params.toString()}`);
      setRevenueStats(response.data);
    } catch (error: any) {
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to fetch revenue statistics',
        variant: 'destructive',
      });
    }
  };

  // Fetch Orders Analytics
  const fetchOrdersAnalytics = async () => {
    try {
      const response = await api.get('/dashboard/orders-analytics');
      setOrdersAnalytics(response.data);
    } catch (error: any) {
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to fetch orders analytics',
        variant: 'destructive',
      });
    }
  };

  // Fetch Users Analytics
  const fetchUsersAnalytics = async () => {
    try {
      const response = await api.get('/dashboard/users-analytics');
      setUsersAnalytics(response.data);
    } catch (error: any) {
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to fetch users analytics',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminContext.Provider
      value={{
        // Dashboard
        dashboardStats,
        fetchDashboardStats,
        loadingStats,

        // Users
        users,
        usersPagination,
        fetchUsers,
        deleteUser,
        loadingUsers,

        // Orders
        orders,
        ordersPagination,
        fetchOrders,
        updateOrderStatus,
        loadingOrders,

        // Analytics
        revenueStats,
        ordersAnalytics,
        usersAnalytics,
        fetchRevenueStats,
        fetchOrdersAnalytics,
        fetchUsersAnalytics,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};