import { AnimatePresence } from "framer-motion";

const DMCANotice = () => {
  return (
    <AnimatePresence mode="wait">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">DMCA Notice</h1>
        <p className="mb-4">Let's Stream V2.0 respects the intellectual property rights of others and expects its users to do the same. It is our policy to respond to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA) and other applicable laws.</p>
        <p>If you believe that your work has been copied in a way that constitutes copyright infringement, please provide us with the following information:</p>
        <ul className="list-disc list-inside mb-4">
          <li>A physical or electronic signature of the person authorized to act on behalf of the owner of the copyright interest.</li>
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material.</li>
          <li>Information reasonably sufficient to permit us to contact the complaining party, such as an address, telephone number, and, if available, an email address at which the complaining party may be contacted.</li>
          <li>A statement that the complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
          <li>A statement that the information in the notification is accurate, and under penalty of perjury, that the signing party is authorized to act on behalf of the owner of the copyright or other intellectual property right that is allegedly infringed.</li>
        </ul>
        <p>Please send your DMCA notice to our designated copyright agent at [email address].</p>
      </div>
    </AnimatePresence>
  );
};

export default DMCANotice;
