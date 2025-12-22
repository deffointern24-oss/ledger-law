// src/contexts/WishlistContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useUser } from './UserContext';

interface WishlistItem {
  serviceId: string;
  serviceName: string;
  price: number;
  addedAt?: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (id: string, name: string, price: number) => Promise<void>;
  removeFromWishlist: (serviceId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  fetchWishlist: () => Promise<void>;
  totalItems: number;
  isInWishlist: (serviceId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const api = useApi();
  const { user, isAuthenticated } = useUser();
  const [items, setItems] = useState<WishlistItem[]>([]);

  // ✅ FIXED: Fetch wishlist when component mounts or user changes
  useEffect(() => {
    if (user && isAuthenticated) {
      // Only fetch if user is not admin
      if (user.role !== 'admin') {
        fetchWishlist();
      }
    } else {
      // Clear wishlist when user logs out
      setItems([]);
    }
  }, [user, isAuthenticated]);

  // Fetch wishlist from backend
  const fetchWishlist = async () => {
    if (!user || user.role === 'admin') {
      return;
    }

    try {
      const response = await api.get('/wishlist');
      // ✅ FIXED: Use consistent path
      const wishlistItems = response.data?.wishlist?.items || response.data?.items || [];
      setItems(wishlistItems);
    } catch (error) {
      
      setItems([]);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (id: string, name: string, price: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to add items to wishlist',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    if (user?.role === 'admin') {
      toast({
        title: 'Admin Account Detected',
        description: 'Admin accounts cannot add items to wishlist. Redirecting to admin dashboard...',
        variant: 'default',
      });
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      const response = await api.post('/wishlist/add', {
        serviceId: id,
        serviceName: name,
        price: price,
      });
      const wishlistItems = response.data?.wishlist?.items || response.data?.items || [];
      setItems(wishlistItems);
      
      toast({
        title: 'Success',
        description: `${name} added to wishlist!`,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add to wishlist';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (serviceId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to manage wishlist',
        variant: 'destructive',
      });
      return;
    }

    if (user?.role === 'admin') {
      toast({
        title: 'Admin Account',
        description: 'Admin accounts cannot manage wishlist. Redirecting...',
        variant: 'default',
      });
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      const response = await api.del(`/wishlist/${serviceId}`);
      
      const wishlistItems = response.data?.wishlist?.items || response.data?.items || [];
      setItems(wishlistItems);
      
      toast({
        title: 'Success',
        description: 'Removed from wishlist',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove from wishlist';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to manage wishlist',
        variant: 'destructive',
      });
      return;
    }

    if (user?.role === 'admin') {
      toast({
        title: 'Admin Account',
        description: 'Admin accounts cannot manage wishlist. Redirecting...',
        variant: 'default',
      });
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      await api.del('/wishlist/clear');
      setItems([]);
      
      toast({
        title: 'Success',
        description: 'Wishlist cleared',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to clear wishlist';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (serviceId: string) => {
    if (!isAuthenticated || user?.role === 'admin') return false;
    return items.some(item => item.serviceId === serviceId);
  };

  const totalItems = items.length;

  return (
    <WishlistContext.Provider value={{
      items,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      fetchWishlist,
      totalItems,
      isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};