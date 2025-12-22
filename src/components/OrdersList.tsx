// components/OrdersList.tsx
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Package, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const OrdersList = () => {
  const { 
    myOrders, 
    fetchMyOrders, 
    loadMoreOrders, 
    myOrdersHasMore, 
    myOrdersTotalCount,
    isLoading 
  } = useUser();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Initial load
  useEffect(() => {
    fetchMyOrders(1, 5, false);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && myOrdersHasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          await loadMoreOrders();
          setIsLoadingMore(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [myOrdersHasMore, isLoadingMore, loadMoreOrders]);

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

  const getOrderStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading && myOrders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (myOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">No orders found</p>
        <p className="text-xs text-gray-500">Your orders will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Orders List */}
      {myOrders.map((order) => {
        const isExpanded = expandedOrderId === order._id;
        
        return (
          <Card
            key={order._id}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Collapsed View */}
            <div
              className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleOrderExpand(order._id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      #{order.orderNumber}
                    </span>
                    <Badge
                      variant={getPaymentStatusVariant(order.paymentStatus)}
                      className="text-xs"
                    >
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{order.pricing?.total?.toFixed(2) || '0.00'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t bg-gray-50 p-4 space-y-3">
                {/* Order Status */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Order Status:</span>
                  <Badge variant={getOrderStatusVariant(order.orderStatus)} className="text-xs">
                    {order.orderStatus}
                  </Badge>
                </div>

                {/* Customer Info */}
                {order.customerInfo && (
                  <div className="bg-white rounded p-2 text-xs">
                    <p className="font-medium text-gray-900 mb-1">Customer Details</p>
                    <div className="space-y-0.5 text-gray-600">
                      <p><span className="font-medium">Name:</span> {order.customerInfo.name}</p>
                      <p><span className="font-medium">Email:</span> {order.customerInfo.email}</p>
                      <p><span className="font-medium">Phone:</span> {order.customerInfo.phone}</p>
                      {order.customerInfo.businessName && (
                        <p><span className="font-medium">Business:</span> {order.customerInfo.businessName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Items:</p>
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-xs bg-white p-2 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.serviceName}</p>
                        {item.description && (
                          <p className="text-gray-500 text-[10px] mt-0.5">{item.description}</p>
                        )}
                        <p className="text-gray-600 mt-1">
                          Rate: ₹{item.rate || item.price} × Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-gray-900">
                          ₹{(item.amount || (item.rate || item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                {order.pricing && (
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{order.pricing.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST ({order.pricing.gstRate}%)</span>
                      <span>₹{order.pricing.gstAmount?.toFixed(2)}</span>
                    </div>
                    {order.pricing.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{order.pricing.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1 border-t">
                      <span>Total</span>
                      <span>₹{order.pricing.total?.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                {order.razorpayPaymentId && (
                  <div className="bg-white p-2 rounded text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <CreditCard className="h-3 w-3 text-gray-600" />
                      <span className="font-medium text-gray-900">Payment Details</span>
                    </div>
                    <p className="text-gray-600 mb-1">
                      <span className="font-medium">Method:</span> {order.paymentMethod}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Payment ID:</span>
                    </p>
                    <p className="font-mono text-[10px] text-gray-500 break-all">
                      {order.razorpayPaymentId}
                    </p>
                  </div>
                )}

                {/* Estimate Date */}
                {order.estimateDate && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                    <p className="text-blue-900">
                      <span className="font-semibold">Estimated Completion:</span>{' '}
                      {new Date(order.estimateDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading more orders...</span>
        </div>
      )}

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="h-4" />

      {/* Show total count */}
      {myOrdersTotalCount > 0 && (
        <div className="text-center text-sm text-gray-600 py-2">
          Showing {myOrders.length} of {myOrdersTotalCount} orders
        </div>
      )}

      {/* End Message */}
      {!myOrdersHasMore && myOrders.length > 0 && (
        <div className="text-center text-sm text-gray-500 py-4 border-t">
          ✓ You've reached the end
        </div>
      )}
    </div>
  );
};

export default OrdersList;
