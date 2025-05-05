import { WatchlistItem, MediaBaseItem } from '@/contexts/types/watch-history';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { generateId } from '@/utils/supabase';

export async function addToWatchlistHelper({ user, watchlist, item, db, toast, setWatchlist }) {
  const existingItem = watchlist.find(watch => watch.media_id === item.media_id && watch.media_type === item.media_type);
  if (existingItem) return;
  const newItem: WatchlistItem = {
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
  const watchlistRef = doc(db, 'watchlist', newItem.id);
  await setDoc(watchlistRef, newItem);
  setWatchlist([newItem, ...watchlist]);
  if (toast) toast({ title: 'Added to watchlist', description: `${item.title} has been added to your watchlist.` });
}

export async function removeFromWatchlistHelper({ user, watchlist, mediaId, mediaType, db, setWatchlist }) {
  const itemToRemove = watchlist.find(item => item.media_id === mediaId && item.media_type === mediaType);
  if (itemToRemove) {
    const watchlistRef = doc(db, 'watchlist', itemToRemove.id);
    await deleteDoc(watchlistRef);
    setWatchlist(watchlist.filter(item => !(item.media_id === mediaId && item.media_type === mediaType)));
  }
}

export function isInWatchlistHelper(watchlist, mediaId, mediaType) {
  return watchlist.some(item => item.media_id === mediaId && item.media_type === mediaType);
}

export async function deleteWatchlistItemHelper({ user, watchlist, id, db, setWatchlist, toast }) {
  const watchlistRef = doc(db, 'watchlist', id);
  await deleteDoc(watchlistRef);
  setWatchlist(watchlist.filter(item => item.id !== id));
  if (toast) toast({ title: 'Item removed', description: 'The item has been removed from your watchlist.' });
}

export async function deleteSelectedWatchlistHelper({ user, watchlist, ids, db, setWatchlist, toast }) {
  const batch = writeBatch(db);
  ids.forEach(id => {
    const watchlistRef = doc(db, 'watchlist', id);
    batch.delete(watchlistRef);
  });
  await batch.commit();
  setWatchlist(watchlist.filter(item => !ids.includes(item.id)));
  if (toast) toast({ title: 'Items removed', description: `${ids.length} item(s) have been removed from your watchlist.` });
}
