
// Create or update the file with our Media types

export interface Media {
  id: number;
  media_id?: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  vote_average: number;
  media_type: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

export interface ExtendedMedia extends Media {
  media_id: number; // Required in ExtendedMedia
  // Any additional fields needed for the extended version
}

// Helper function to convert Media to ExtendedMedia
export const ensureExtendedMedia = (media: Media): ExtendedMedia => {
  return {
    ...media,
    media_id: media.media_id || media.id, // Ensure media_id is present
    media_type: media.media_type as "movie" | "tv" // Ensure correct media_type
  };
};

// Helper function to convert an array of Media to ExtendedMedia[]
export const ensureExtendedMediaArray = (mediaArray: Media[]): ExtendedMedia[] => {
  return mediaArray.map(ensureExtendedMedia);
};
