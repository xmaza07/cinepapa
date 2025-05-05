import { FavoriteItem, MediaBaseItem } from '@/contexts/types/watch-history';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { generateId } from '@/utils/supabase';

export async function addToFavoritesHelper({ user, favorites, item, db, toast, setFavorites }) {
  const existingItem = favorites.find(fav => fav.media_id === item.media_id && fav.media_type === item.media_type);
  if (existingItem) return;
  const newItem: FavoriteItem = {
    id: generateId(),
    user_id: user.uid,
    media_id: item.media_id,
    media_type: item.media_type,
    title: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview,
    rating: item.rating,
    added_at: new Date().toISOString()
  };
  const favoriteRef = doc(db, 'favorites', newItem.id);
  await setDoc(favoriteRef, newItem);
  setFavorites([newItem, ...favorites]);
  if (toast) toast({ title: 'Added to favorites', description: `${item.title} has been added to your favorites.` });
}

export async function removeFromFavoritesHelper({ user, favorites, mediaId, mediaType, db, setFavorites }) {
  const itemToRemove = favorites.find(item => item.media_id === mediaId && item.media_type === mediaType);
  if (itemToRemove) {
    const favoriteRef = doc(db, 'favorites', itemToRemove.id);
    await deleteDoc(favoriteRef);
    setFavorites(favorites.filter(item => !(item.media_id === mediaId && item.media_type === mediaType)));
  }
}

export function isInFavoritesHelper(favorites, mediaId, mediaType) {
  return favorites.some(item => item.media_id === mediaId && item.media_type === mediaType);
}

export async function deleteFavoriteItemHelper({ user, favorites, id, db, setFavorites, toast }) {
  const favoriteRef = doc(db, 'favorites', id);
  await deleteDoc(favoriteRef);
  setFavorites(favorites.filter(item => item.id !== id));
  if (toast) toast({ title: 'Item removed', description: 'The item has been removed from your favorites.' });
}

export async function deleteSelectedFavoritesHelper({ user, favorites, ids, db, setFavorites, toast }) {
  const batch = writeBatch(db);
  ids.forEach(id => {
    const favoriteRef = doc(db, 'favorites', id);
    batch.delete(favoriteRef);
  });
  await batch.commit();
  setFavorites(favorites.filter(item => !ids.includes(item.id)));
  if (toast) toast({ title: 'Items removed', description: `${ids.length} item(s) have been removed from your favorites.` });
}
