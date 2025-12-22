
import Breadcrumb from '@/components/producer-company/Breadcrumb';
import HeroSection from '@/components/producer-company/HeroSection';
import DetailsSection from '@/components/producer-company/DetailsSection';
import PricingSection  from '@/components/producer-company/PricingSection';


const ProducerCompany = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50/50">
        <main className="max-w-screen-xl mx-auto px-4 py-6">
          <Breadcrumb />
          <div >
            <div>
              <HeroSection />
              <PricingSection/>
              <DetailsSection />
            </div>
            <aside className="lg:col-span-1">
              
            </aside>
          </div>
        </main>
  </div>
    </div>
  );
};

export default ProducerCompany;
