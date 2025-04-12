
// Types for the custom streaming API

// Video file representation from the API
export interface VideoFile {
  file: string;
  type: string;
  quality: string;
  lang: string;
}

// Video source representation from the API
export interface VideoSource {
  provider: string;
  files?: VideoFile[];
  ERROR?: any[];
  headers?: Record<string, string>;
  subtitles?: any[];
}

// API response format
export interface ApiResponse {
  source?: VideoSource;
  sources?: VideoSource[] | VideoSource;
  provider?: string;
  ERROR?: any[];
}

// Configuration for the API
export interface CustomApiConfig {
  apiUrl: string;
  proxyUrl: string;
}
