import { useEffect, useState } from 'react';
import { useSearchParams, Link ,useNavigate} from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XCircle, RefreshCcw, Home, MessageCircle, AlertTriangle } from 'lucide-react';

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }else
    {
      navigate('/cart', { replace: true });
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-500">
        <CardContent className="p-8 md:p-12">
          {/* Failed Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-75"></div>
              <div className="relative bg-red-500 rounded-full p-4">
                <XCircle className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Failed Message */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 animate-in slide-in-from-bottom duration-700">
              Payment Failed
            </h1>
            <p className="text-xl text-muted-foreground animate-in slide-in-from-bottom duration-700 delay-100">
              We couldn't process your payment. Please try again.
            </p>
          </div>

          {/* Order/Transaction Details */}
          {orderId && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 mb-8 animate-in slide-in-from-bottom duration-700 delay-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-gray-900">Transaction ID</h3>
                </div>
                <Badge variant="destructive">
                  Failed
                </Badge>
              </div>
              <div className="bg-white rounded-md p-4 font-mono text-sm break-all border-2 border-red-200">
                {orderId}
              </div>
            </div>
          )}

          {/* Common Reasons */}
          <div className="mb-8 animate-in slide-in-from-bottom duration-700 delay-300">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Common Reasons for Failure
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Insufficient balance in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Incorrect card details or expired card</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Transaction declined by your bank</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Network or connectivity issues</span>
              </li>
            </ul>
          </div>

          {/* What to Do Next */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-in slide-in-from-bottom duration-700 delay-400">
            <h4 className="font-semibold text-blue-900 mb-2">💡 What to do next?</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Check your payment method and account balance</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Try using a different payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Contact your bank if the issue persists</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 animate-in slide-in-from-bottom duration-700 delay-500">
            <Link to="/cart" className="flex-1">
              <Button size="lg" className="w-full">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button size="lg" variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Auto redirect message */}
          {countdown > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-6 animate-in fade-in duration-700 delay-600">
              Redirecting to cart in {countdown} seconds...
            </p>
          )}

          {/* Support Message */}
          <div className="text-center mt-8 pt-6 border-t animate-in fade-in duration-700 delay-700">
            <p className="text-sm text-muted-foreground mb-3">
              Still having issues? We're here to help!
            </p>
            <Link to="/contact">
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
