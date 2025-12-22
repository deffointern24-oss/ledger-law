import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BusinessType = "public-limited" | "company" | "llp" | "opc";

const businessTypes = {
  "public-limited": {
    title: "Public Limited Company",
    description: "A Public Limited Company is a separate legal entity with limited liability and a minimum of 3 directors and 7 shareholders. It is eligible to raise capital from the public by issuing shares, making it a suitable structure for large enterprises aiming for substantial funding, market expansion, and increased corporate transparency."
  },
  "company": {
    title: "Private Limited Company", 
    description: "A Private Limited Company is a separate legal entity with limited liability and a minimum of 2 shareholders and 2 directors. This is the most preferred entity for startups and SMEs due to ease of fundraising, scalability, and investor trust."
  },
  "llp": {
    title: "Limited Liability Partnership",
    description: "An LLP offers the flexibility of a partnership with the benefits of limited liability and reduced compliance. Popular among professionals and small service businesses due to cost-effective compliance and partner protection."
  },
  "opc": {
    title: "One Person Company",
    description: "An OPC allows a single individual to own and manage a limited liability company without needing a partner. Ideal for solo entrepreneurs who want corporate status and limited liability without diluting control."
  }
};

const HeroSection = () => {
  const [selectedType, setSelectedType] = useState<BusinessType>("public-limited");
  const [companyName, setCompanyName] = useState("");
  const [selectedState, setSelectedState] = useState("");

  return (
    <div className="bg-white">
      <div className="grid  gap-8 items-start">

        {/* Right side - Registration form */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Register a Business</h1>
            <Button variant="outline" className="text-gray-700 border-gray-300">
              Consult Advisor
            </Button>
          </div>

          {/* Business Type Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(businessTypes).map(([key, type]) => (
              <Button
                key={key}
                variant={selectedType === key ? "default" : "outline"}
                onClick={() => setSelectedType(key as BusinessType)}
                className={
                  selectedType === key 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "text-gray-700 border-gray-300 hover:bg-gray-50"
                }
              >
                {type.title}
              </Button>
            ))}
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {businessTypes[selectedType].description}
          </p>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Proposed Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                  <SelectItem value="assam">Assam</SelectItem>
                  <SelectItem value="bihar">Bihar</SelectItem>
                  <SelectItem value="chhattisgarh">Chhattisgarh</SelectItem>
                  <SelectItem value="goa">Goa</SelectItem>
                  <SelectItem value="gujarat">Gujarat</SelectItem>
                  <SelectItem value="haryana">Haryana</SelectItem>
                  <SelectItem value="himachal-pradesh">Himachal Pradesh</SelectItem>
                  <SelectItem value="jharkhand">Jharkhand</SelectItem>
                  <SelectItem value="karnataka">Karnataka</SelectItem>
                  <SelectItem value="kerala">Kerala</SelectItem>
                  <SelectItem value="madhya-pradesh">Madhya Pradesh</SelectItem>
                  <SelectItem value="maharashtra">Maharashtra</SelectItem>
                  <SelectItem value="manipur">Manipur</SelectItem>
                  <SelectItem value="meghalaya">Meghalaya</SelectItem>
                  <SelectItem value="mizoram">Mizoram</SelectItem>
                  <SelectItem value="nagaland">Nagaland</SelectItem>
                  <SelectItem value="odisha">Odisha</SelectItem>
                  <SelectItem value="punjab">Punjab</SelectItem>
                  <SelectItem value="rajasthan">Rajasthan</SelectItem>
                  <SelectItem value="sikkim">Sikkim</SelectItem>
                  <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                  <SelectItem value="telangana">Telangana</SelectItem>
                  <SelectItem value="tripura">Tripura</SelectItem>
                  <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                  <SelectItem value="uttarakhand">Uttarakhand</SelectItem>
                  <SelectItem value="west-bengal">West Bengal</SelectItem>
                  <SelectItem value="andaman-nicobar">Andaman and Nicobar Islands</SelectItem>
                  <SelectItem value="chandigarh">Chandigarh</SelectItem>
                  <SelectItem value="dadra-nagar-haveli">Dadra and Nagar Haveli and Daman and Diu</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="jammu-kashmir">Jammu and Kashmir</SelectItem>
                  <SelectItem value="ladakh">Ladakh</SelectItem>
                  <SelectItem value="lakshadweep">Lakshadweep</SelectItem>
                  <SelectItem value="puducherry">Puducherry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
              size="lg"
            >
              Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
