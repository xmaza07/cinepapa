import { AnimatePresence } from "framer-motion";

const TermsOfService = () => {
  return (
    <AnimatePresence mode="wait">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="mb-4">Welcome to Let's Stream V2.0. These terms and conditions outline the rules and regulations for the use of Let's Stream V2.0's Website.</p>
        <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Let's Stream V2.0 if you do not agree to take all of the terms and conditions stated on this page.</p>
        <p>The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company’s terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client’s needs in respect of provision of the Company’s stated services, in accordance with and subject to, prevailing law of Netherlands. Any use of the above terminology or other words in the singular, plural, capitalization and/or he/she or they, are taken as interchangeable and therefore as referring to same.</p>
      </div>
    </AnimatePresence>
  );
};

export default TermsOfService;
