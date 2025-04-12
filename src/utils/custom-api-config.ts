import { CustomApiConfig } from './custom-api-types';

const customApiConfig: CustomApiConfig = {
  apiUrl: import.meta.env.VITE_CUSTOM_API_URL || 'http://localhost:3000'
};

export default customApiConfig;
