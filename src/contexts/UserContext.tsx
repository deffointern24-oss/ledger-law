// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApi, setupLoadingInterceptor } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
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

interface OrderItem {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
  description?: string;
}

interface Order {
  _id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UserContextType {
  // User Management
  user: User | null;
  fetchUserProfile: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onLogoutCallback: (() => void) | null;
  setOnLogoutCallback: (callback: () => void) => void;
  isInitializing: boolean;

  // Checkout & Payment
  checkout: (items: any[], customerNotes?: string) => Promise<void>;
  isProcessingPayment: boolean;

  // My Orders (Customer)
  myOrders: Order[];
  fetchMyOrders: (page?: number, limit?: number, append?: boolean) => Promise<void>;
  loadMoreOrders: () => Promise<void>;
  myOrdersHasMore: boolean;
  myOrdersTotalCount: number;
  isLoadingMoreOrders: boolean;
  getOrderById: (orderId: string) => Promise<Order | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const api = useApi();

  // User State
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [onLogoutCallback, setOnLogoutCallback] = useState<(() => void) | null>(null);

  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // My Orders State
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myOrdersPage, setMyOrdersPage] = useState(1);
  const [myOrdersHasMore, setMyOrdersHasMore] = useState(true);
  const [myOrdersTotalCount, setMyOrdersTotalCount] = useState(0);
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false);

  // Setup axios loading interceptor on mount
  useEffect(() => {
    setupLoadingInterceptor(setIsLoading);
  }, []);

  // Fetch user profile on mount
  useEffect(() => {
    const initializeUser = async () => {
      await fetchUserProfile();
      setIsInitializing(false);
    };

    initializeUser();
  }, []);

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const response = await api.get('/users/profile');
      if (response.data?.user) {
        setUser(response.data.user);
      } else if (response.data) {
        setUser(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  };

  // Update user locally
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Logout with callback
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('auth_token');
    setUser(null);
    setMyOrders([]);
    setMyOrdersPage(1);
    setMyOrdersHasMore(true);
    setMyOrdersTotalCount(0);

    // Call the logout callback to clear cart/wishlist
    if (onLogoutCallback) {
      onLogoutCallback();
    }

    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
  };

  // Checkout Function
  const checkout = async (items: any[], customerNotes?: string) => {
    if (isProcessingPayment) return;

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to proceed with checkout',
        variant: 'destructive',
      });
      window.location.href = '/login';
      return;
    }

    if (!items || items.length === 0) {
      toast({
        title: 'Cart Empty',
        description: 'Your cart is empty',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const response = await api.post('/payment/create-order', {
        items: items.map(item => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          price: item.price,
          quantity: item.quantity,
          description: item.description || 'Professional service registration',
        })),
        customerNotes: customerNotes || '',
      });

      const { razorpayOrder, order, key } = response.data;

      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error('Invalid order response from server');
      }

      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      const customerInfo = order.customerInfo || {
        name: user.name,
        email: user.email,
        phone: user.phone,
      };

      const options = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Ledger Law',
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrder.id,

        handler: async function (response: any) {
          try {
            await api.post('/payment/payment-verification', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast({
              title: 'Payment Successful! 🎉',
              description: 'Your order has been placed successfully.',
            });

            window.location.href = `/success?orderId=${order._id}&orderNumber=${order.orderNumber}`;
          } catch (verifyError: any) {
            toast({
              title: 'Payment Verification Failed',
              description: verifyError.response?.data?.message || 'Please contact support.',
              variant: 'destructive',
            });

            window.location.href = `/failed?orderId=${order._id}`;
          } finally {
            setIsProcessingPayment(false);
          }
        },

        prefill: {
          name: customerInfo.name || 'Customer',
          email: customerInfo.email || 'customer@example.com',
          contact: customerInfo.phone || '9999999999',
        },

        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);

            toast({
              title: 'Payment Cancelled',
              description: 'You closed the payment window.',
              variant: 'destructive',
            });
          },
        },

        notes: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          userId: user._id,
          userName: user.name,
          customerPhone: customerInfo.phone,
        },

        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new RazorpayConstructor(options);

      rzp.on('payment.failed', function (response: any) {
        setIsProcessingPayment(false);

        toast({
          title: 'Payment Failed',
          description: response.error.description || 'Payment failed. Please try again.',
          variant: 'destructive',
        });
      });

      rzp.open();
    } catch (error: any) {
      setIsProcessingPayment(false);

      toast({
        title: 'Checkout Failed',
        description: error.response?.data?.message || error.message || 'Unable to proceed. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Fetch My Orders (Customer) with pagination
  const fetchMyOrders = async (page: number = 1, limit: number = 10, append: boolean = false) => {
    try {
      const response = await api.get(`/orders/my-orders?page=${page}&limit=${limit}`);

      let orders: Order[] = [];
      let pagination: PaginationInfo | null = null;

      // Handle different response formats
      if (response.data?.orders) {
        orders = response.data.orders;
        pagination = response.data.pagination;
      } else if (Array.isArray(response.data)) {
        orders = response.data;
      }

      // Update state
      if (append) {
        setMyOrders(prev => [...prev, ...orders]);
      } else {
        setMyOrders(orders);
      }

      // Update pagination state
      if (pagination) {
        setMyOrdersHasMore(pagination.hasNextPage);
        setMyOrdersTotalCount(pagination.totalOrders);
        setMyOrdersPage(pagination.currentPage);
      } else {
        setMyOrdersHasMore(false);
      }
    } catch (error: any) {
      if (!append) {
        setMyOrders([]);
      }
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your orders',
        variant: 'destructive',
      });
    }
  };

  // Load More Orders
  const loadMoreOrders = async () => {
    if (myOrdersHasMore && !isLoadingMoreOrders) {
      setIsLoadingMoreOrders(true);
      await fetchMyOrders(myOrdersPage + 1, 10, true);
      setIsLoadingMoreOrders(false);
    }
  };

  // Get Order By ID
  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      if (response.data?.order) {
        return response.data.order;
      } else if (response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        variant: 'destructive',
      });
      return null;
    }
  };

  const isAuthenticated = !!user;

  return (
    <UserContext.Provider
      value={{
        // User Management
        user,
        fetchUserProfile,
        updateUser,
        logout,
        isAuthenticated,
        isLoading,
        setIsLoading,
        onLogoutCallback,
        setOnLogoutCallback,
        isInitializing,

        // Checkout & Payment
        checkout,
        isProcessingPayment,

        // My Orders
        myOrders,
        fetchMyOrders,
        loadMoreOrders,
        myOrdersHasMore,
        myOrdersTotalCount,
        isLoadingMoreOrders,
        getOrderById,
      }}
    >
      {children}

      {/* Global Loading Spinner */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        </div>
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};