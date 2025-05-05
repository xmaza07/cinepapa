import { WatchHistoryItem } from '@/contexts/types/watch-history';
import { doc, setDoc, deleteDoc, writeBatch, collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { generateId } from '@/utils/supabase';
import { deduplicateWatchHistory, filterWatchHistoryDuplicates, isSignificantProgress } from '@/utils/watch-history-utils';

export async function addToWatchHistoryHelper({ user, userPreferences, media, position, duration, season, episode, preferredSource, watchHistory, lastUpdateTimestamps, MINIMUM_UPDATE_INTERVAL, SIGNIFICANT_PROGRESS, db, toast, setWatchHistory, saveLocalWatchHistory, queueOperation, writeRateLimiter }) {
  if (!user) {
    if (toast) toast({ title: 'Authentication required', description: 'Please log in to track your watch history.', variant: 'destructive' });
    return;
  }
  if (!userPreferences?.isWatchHistoryEnabled) return;
  if (!user.uid) return;
  const mediaType = media.media_type;
  const mediaId = media.id;
  const title = media.title || media.name || '';
  const mediaKey = `${mediaId}-${mediaType}-${season || ''}-${episode || ''}`;
  const now = Date.now();
  const lastUpdate = lastUpdateTimestamps.get(mediaKey) || 0;
  if (now - lastUpdate < MINIMUM_UPDATE_INTERVAL) return;
  const newItem: WatchHistoryItem = {
    id: generateId(),
    user_id: user.uid,
    media_id: mediaId,
    media_type: mediaType,
    title,
    poster_path: media.poster_path,
    backdrop_path: media.backdrop_path,
    overview: media.overview || undefined,
    rating: media.vote_average || 0,
    watch_position: position,
    duration,
    created_at: new Date().toISOString(),
    preferred_source: preferredSource || '',
    ...(typeof season === 'number' ? { season } : {}),
    ...(typeof episode === 'number' ? { episode } : {})
  };
  const { items: updatedHistory, existingItem } = filterWatchHistoryDuplicates(watchHistory, newItem);
  if (existingItem && position > 0) {
    if (!isSignificantProgress(existingItem.watch_position, position, SIGNIFICANT_PROGRESS)) return;
  }
  setWatchHistory(updatedHistory);
  saveLocalWatchHistory(updatedHistory);
  lastUpdateTimestamps.set(mediaKey, now);
  if (!navigator.onLine) {
    queueOperation(async () => {
      const historyRef = doc(db, 'watchHistory', newItem.id);
      await setDoc(historyRef, newItem);
    });
    return;
  }
  const canExecute = await writeRateLimiter.canExecute();
  if (!canExecute) {
    queueOperation(async () => {
      const historyRef = doc(db, 'watchHistory', newItem.id);
      await setDoc(historyRef, newItem);
    });
    return;
  }
  try {
    if (existingItem) {
      const existingRef = doc(db, 'watchHistory', existingItem.id);
      await deleteDoc(existingRef);
    }
    const historyRef = doc(db, 'watchHistory', newItem.id);
    await setDoc(historyRef, newItem);
  } catch (error) {
    queueOperation(async () => {
      const historyRef = doc(db, 'watchHistory', newItem.id);
      await setDoc(historyRef, newItem);
    });
  }
}

export async function updateWatchPositionHelper({ user, mediaId, mediaType, position, season, episode, preferredSource, lastUpdateTimestamps, MINIMUM_UPDATE_INTERVAL, watchHistory, writeRateLimiter, watchPositionQueue, setWatchHistory, saveLocalWatchHistory, SIGNIFICANT_PROGRESS, db, toast }) {
  if (!user) return;
  const mediaKey = `${mediaId}-${mediaType}-${season || ''}-${episode || ''}`;
  const now = Date.now();
  const lastUpdate = lastUpdateTimestamps.get(mediaKey) || 0;
  if (now - lastUpdate < MINIMUM_UPDATE_INTERVAL) return;
  lastUpdateTimestamps.set(mediaKey, now);
  const updatedItemData = {
    watch_position: position,
    created_at: new Date().toISOString(),
    ...(typeof season === 'number' ? { season } : {}),
    ...(typeof episode === 'number' ? { episode } : {}),
    ...(preferredSource ? { preferred_source: preferredSource } : {})
  };
  try {
    const existingItem = watchHistory.find(item =>
      item.media_id === mediaId &&
      item.media_type === mediaType &&
      item.season === season &&
      item.episode === episode
    );
    const canExecute = await writeRateLimiter.canExecute();
    if (!canExecute) {
      if (existingItem) {
        const updatedHistory = watchHistory.map(h =>
          h.id === existingItem.id ? { ...h, ...updatedItemData } : h
        );
        setWatchHistory(updatedHistory);
        saveLocalWatchHistory(updatedHistory);
      }
      return;
    }
    if (existingItem) {
      const progressDifference = Math.abs(existingItem.watch_position - position);
      if (progressDifference < SIGNIFICANT_PROGRESS) return;
      const historyRef = doc(db, 'watchHistory', existingItem.id);
      watchPositionQueue.set(mediaKey, { data: { historyRef, updatedItemData }, timestamp: now });
      const updatedHistory = watchHistory.map(h =>
        h.id === existingItem.id ? { ...h, ...updatedItemData } : h
      );
      setWatchHistory(updatedHistory);
      saveLocalWatchHistory(updatedHistory);
    }
  } catch (error) {
    if (toast) toast({ title: 'Error updating progress', description: 'There was a problem updating your watch progress.', variant: 'destructive' });
  }
}

export async function clearWatchHistoryHelper({ user, db, deleteRateLimiter, setWatchHistory, saveLocalWatchHistory, toast }) {
  if (!user) return;
  if (!navigator.onLine) {
    setWatchHistory([]);
    saveLocalWatchHistory([]);
    if (toast) toast({ title: 'Watch history cleared', description: 'Your watch history has been successfully cleared.' });
    return;
  }
  try {
    const historyRef = collection(db, 'watchHistory');
    const historyQuery = query(historyRef, where('user_id', '==', user.uid));
    const historySnapshot = await getDocs(historyQuery);
    const canExecute = await deleteRateLimiter.canExecute();
    if (!canExecute) return;
    const deletePromises = historySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    setWatchHistory([]);
    saveLocalWatchHistory([]);
    if (toast) toast({ title: 'Watch history cleared', description: 'Your watch history has been successfully cleared.' });
  } catch (error) {
    if (toast) toast({ title: 'Error clearing history', description: 'There was a problem clearing your watch history.', variant: 'destructive' });
  }
}

export async function deleteWatchHistoryItemHelper({ user, id, db, deleteRateLimiter, watchHistory, setWatchHistory, saveLocalWatchHistory, toast }) {
  if (!user) return;
  try {
    const canExecute = await deleteRateLimiter.canExecute();
    if (!canExecute) return;
    const historyRef = doc(db, 'watchHistory', id);
    await deleteDoc(historyRef);
    const updatedHistory = watchHistory.filter(item => item.id !== id);
    setWatchHistory(updatedHistory);
    saveLocalWatchHistory(updatedHistory);
    if (toast) toast({ title: 'Item removed', description: 'The item has been removed from your watch history.' });
  } catch (error) {
    if (toast) toast({ title: 'Error removing item', description: 'There was a problem removing the item from your history.', variant: 'destructive' });
  }
}

export async function deleteSelectedWatchHistoryHelper({ user, ids, db, deleteRateLimiter, watchHistory, setWatchHistory, saveLocalWatchHistory, toast }) {
  if (!user || ids.length === 0) return;
  try {
    const canExecute = await deleteRateLimiter.canExecute();
    if (!canExecute) {
      if (toast) toast({ title: 'Rate limit exceeded', description: 'Too many operations in a short time. Please try again later.', variant: 'destructive' });
      return;
    }
    const batch = writeBatch(db);
    ids.forEach(id => {
      const historyRef = doc(db, 'watchHistory', id);
      batch.delete(historyRef);
    });
    await batch.commit();
    const updatedHistory = watchHistory.filter(item => !ids.includes(item.id));
    setWatchHistory(updatedHistory);
    saveLocalWatchHistory(updatedHistory);
    if (toast) toast({ title: 'Items removed', description: `${ids.length} item(s) have been removed from your watch history.` });
  } catch (error) {
    if (toast) toast({ title: 'Error removing items', description: 'There was a problem removing the items from your history.', variant: 'destructive' });
  }
}
