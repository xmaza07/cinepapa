import { AnimatePresence } from "framer-motion";

const ContentRemoval = () => {
  return (
    <AnimatePresence mode="wait">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Content Removal</h1>
        <p className="mb-4">Let's Stream V2.0 respects the intellectual property rights of others and expects its users to do the same. If you believe that your content has been uploaded to our platform without proper authorization, please follow these steps to request the removal of your content:</p>
        <ol className="list-decimal list-inside mb-4">
          <li>Provide a detailed description of the content that you believe has been infringed upon.</li>
          <li>Include the URL or any other relevant information that can help us locate the content.</li>
          <li>Specify the reason for your request, such as copyright infringement or other intellectual property rights violations.</li>
          <li>Include your contact information, including your name, address, telephone number, and email address.</li>
          <li>Sign the request and date it.</li>
        </ol>
        <p>Please send your content removal request to our designated copyright agent at [email address].</p>
      </div>
    </AnimatePresence>
  );
};

export default ContentRemoval;
