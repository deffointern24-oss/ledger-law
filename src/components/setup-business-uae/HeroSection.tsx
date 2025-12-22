import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

import AddToCartButton from "@/components/ui/AddToCartButton";
import AddToWishlistButton from "@/components/ui/AddToWishlistButton";
const HeroSection = () => {
  const { addToCart } = useCart();



  return (
    <section className="bg-gradient-to-r from-amber-600 to-orange-700 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Setup Your Business in UAE
          </h1>
          <p className="text-xl mb-8 text-amber-100">
            Complete business incorporation and setup services in the United Arab Emirates
          </p>
         src/components/section8-company/PricingSection.tsx
          </div>
        
      </div>
    </section>
  );
};

export default HeroSection;