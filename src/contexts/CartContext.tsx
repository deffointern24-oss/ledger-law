// src/contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useUser } from './UserContext';

interface CartItem {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (id: string, name: string, price: number) => Promise<void>;
  updateCartItem: (serviceId: string, quantity: number) => Promise<void>;
  removeFromCart: (serviceId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const api = useApi();
  const { user, isAuthenticated } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);

  // Fetch cart when user is authenticated, clear when logged out
  useEffect(() => {
    if (user) {
      // Only fetch cart if user is not admin
      if (user.role !== 'admin') {
        fetchCart();
      }
    } else {
      // Clear cart when user logs out
      setItems([]);
    }
  }, [user]);

  // Fetch cart from backend
  const fetchCart = async () => {
    if (!user || user.role === 'admin') {
      return;
    }

    try {
      const response = await api.get('/cart');
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setItems([]);
    }
  };

  // Add item to cart
  const addToCart = async (id: string, name: string, price: number) => {
    // Check if user is not authenticated
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to add items to cart',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    // Check if user is admin
    if (user?.role === 'admin') {
      toast({
        title: 'Admin Account Detected',
        description: 'Admin accounts cannot add items to cart. Redirecting to admin dashboard...',
        variant: 'default',
      });
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      const response = await api.post('/cart/add', {
        serviceId: id,
        serviceName: name,
        price: price,
        quantity: 1
      });
      setItems(response.data.cart.items || []);
      toast({
        title: 'Success',
        description: 'Added to cart!',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update cart item quantity
  const updateCartItem = async (serviceId: string, quantity: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to manage cart',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is admin
    if (user?.role === 'admin') {
      toast({
        title: 'Admin Account',
        description: 'Admin accounts cannot manage cart. Redirecting...',
        variant: 'default',
      });
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      const response = await api.put('/cart/update', { serviceId, quantity });
      setItems(response.data.cart.items || []);
      toast({
        title: 'Success',
        description: 'Cart updated',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update cart';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Remove item from cart
  const removeFromCart = async (serviceId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to manage cart',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is admin
    if (user?.role === 'admin') {
      toast({
        title: 'Admin Account',
        description: 'Admin accounts cannot manage cart. Redirecting...',
        variant: 'default',
      });
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      const response = await api.del(`/cart/remove/${serviceId}`);
      setItems(response.data.cart.items || []);
      toast({
        title: 'Success',
        description: 'Removed from cart',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove from cart';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to manage cart',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is admin
    if (user?.role === 'admin') {
      toast({
        title: 'Admin Account',
        description: 'Admin accounts cannot manage cart. Redirecting...',
        variant: 'default',
      });
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      await api.del('/cart/clear');
      setItems([]);
      toast({
        title: 'Success',
        description: 'Cart cleared',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      fetchCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};