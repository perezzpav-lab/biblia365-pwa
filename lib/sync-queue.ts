import type { ModoLectura } from "@/components/home/ModeSwitcher";

const SYNC_QUEUE_KEY = "biblia365_sync_queue_v1";

export type SyncQueueItem = {
  id: string;
  userId: string;
  day: number;
  mode: ModoLectura;
  completedAt: string;
  streakValue: number;
  completedDays: number[];
};

function readQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SyncQueueItem[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function getQueueByUser(userId: string): SyncQueueItem[] {
  return readQueue().filter((item) => item.userId === userId);
}

export function pushSyncItem(item: SyncQueueItem): void {
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
}

export function removeSyncItem(itemId: string): void {
  const queue = readQueue().filter((item) => item.id !== itemId);
  writeQueue(queue);
}

export function clearSyncQueueByUser(userId: string): void {
  const queue = readQueue().filter((item) => item.userId !== userId);
  writeQueue(queue);
}
