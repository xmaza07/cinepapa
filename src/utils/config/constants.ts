// TMDB API configuration
export const TMDB = {
  API_KEY: import.meta.env.VITE_TMDB_API_KEY,
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
} as const;

// Image sizes
export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original',
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original',
  },
  logo: {
    small: 'w45',
    medium: 'w185',
    large: 'w500',
    original: 'original',
  },
} as const;
