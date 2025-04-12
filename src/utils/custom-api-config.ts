
import { CustomApiConfig } from './custom-api-types';

// Default configuration for the custom API
export const customApiConfig: CustomApiConfig = {
  apiUrl: import.meta.env.VITE_CUSTOM_API_URL || 'https://tmdb-embed-api.vercel.app',
  proxyUrl: import.meta.env.VITE_PROXY_URL || 'https://m3u8proxy.chintanr21.workers.dev'
};
