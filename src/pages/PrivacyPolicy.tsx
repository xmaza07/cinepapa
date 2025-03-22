import { AnimatePresence } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <AnimatePresence mode="wait">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4">At Let's Stream V2.0, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and disclose your personal information when you use our website.</p>
        <p>We may collect personal information from you, such as your name, email address, and other contact details when you register on our website or use our services. We use this information to provide and improve our services, to communicate with you, and to personalize your experience on our website.</p>
        <p>We may also collect non-personal information, such as your IP address, browser type, and operating system, to help us understand how our website is being used and to improve our services.</p>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent. However, we may share your personal information with third-party service providers who help us operate our website and provide our services, such as payment processors and email marketing services. These third parties are required to keep your personal information confidential and use it only for the purposes for which we disclose it to them.</p>
        <p>We may also disclose your personal information if required by law or if we believe that such action is necessary to comply with legal obligations, protect our rights, or protect the safety of our users.</p>
        <p>We take reasonable measures to protect your personal information from unauthorized access, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
        <p>We may update this Privacy Policy from time to time. If we make any material changes to this Privacy Policy, we will notify you by posting a notice on our website or by sending you an email. We encourage you to review this Privacy Policy periodically to stay informed about our privacy practices.</p>
      </div>
    </AnimatePresence>
  );
};

export default PrivacyPolicy;
