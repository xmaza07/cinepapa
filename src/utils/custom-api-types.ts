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
  ERROR?: Array<{
    error: string;
    what_happened: string;
    report_issue?: string;
  }>;
  headers?: Record<string, string>;
  subtitles?: Array<{
    lang: string;
    label: string;
    file: string;
  }>;
}

// API response format
export interface ApiResponse {
  source?: VideoSource;
  sources?: VideoSource[] | VideoSource;
  provider?: string;
  ERROR?: Array<{
    error: string;
    what_happened: string;
    report_issue?: string;
  }>;
}

// Configuration for the API
export interface CustomApiConfig {
  apiUrl: string;
}
