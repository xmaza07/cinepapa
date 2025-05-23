// Environment variables with type-safe defaults
interface EnvConfig {
  GEMINI_API_KEY: string;
  TMDB_API_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// For development/demo purposes, using mock values
// In production, these would come from environment variables
const env: EnvConfig = {
  GEMINI_API_KEY: 'AIzaSyCDjEQv5o7SUPbwSQ9LzFsXIPDJ0qYzpF4',
  TMDB_API_KEY: '297f1b91919bae59d50ed815f8d2e14c',
  NODE_ENV: 'development' // or 'development', 'test'
};

export default env;