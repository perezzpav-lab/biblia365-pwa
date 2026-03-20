export type CachedReading<TPlan, TPregunta> = {
  day: number;
  cachedAt: number;
  plan: TPlan;
  question: TPregunta | null;
};

const DB_NAME = "biblia365-offline-db";
const STORE_NAME = "readings";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "day" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheReading<TPlan, TPregunta>(
  payload: CachedReading<TPlan, TPregunta>,
): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(payload);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getCachedReading<TPlan, TPregunta>(
  day: number,
): Promise<CachedReading<TPlan, TPregunta> | null> {
  const db = await openDB();
  const result = await new Promise<CachedReading<TPlan, TPregunta> | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(day);
    request.onsuccess = () => resolve((request.result as CachedReading<TPlan, TPregunta>) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function pruneCachedReadings(keepLatest = 7): Promise<void> {
  const db = await openDB();
  const all = await new Promise<Array<{ day: number; cachedAt: number }>>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as Array<{ day: number; cachedAt: number }>) ?? []);
    request.onerror = () => reject(request.error);
  });

  if (all.length <= keepLatest) {
    db.close();
    return;
  }

  const toDelete = all
    .sort((a, b) => b.cachedAt - a.cachedAt)
    .slice(keepLatest)
    .map((entry) => entry.day);

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const day of toDelete) {
      store.delete(day);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

export async function clearCachedReadings(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
