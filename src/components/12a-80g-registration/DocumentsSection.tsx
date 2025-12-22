
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const DocumentsSection = () => {
    const docs = [
        "Trust Deed/Society Registration Certificate/Section 8 Company Certificate",
        "Memorandum of Association and Articles of Association (for Section 8 companies only)",
        "PAN card of the organization",
        "Bank account statement of the organization",
        "Audited accounts of the organization for the last three years",
        "List of trustees/members/directors of the organization",
        "List of activities carried out by the organization"
    ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents Required for 12A and 80G Registration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <p>For NGOs to successfully complete the online registration process for 12A and 80G, they must provide a comprehensive set of documents required for 12A and 80G registration that verify their legal registration. Failure to provide these documents could result in the application being considered incomplete and subsequently rejected by the authorities. Below is a detailed list of documents required for 12A and 80G registrations in India.</p>
            <h3 className="text-lg font-semibold my-3">Here's the list covers the 12A and 80G registration documents required:</h3>
            <ul className="space-y-3">
                {docs.map((doc, index) => (
                    <li key={index} className="flex items-start">
                        <FileText className="h-5 w-5 mr-3 text-green-500 mt-1 flex-shrink-0" />
                        <span>{doc}</span>
                    </li>
                ))}
            </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentsSection;
