const DB_NAME = "speakloop";
const STORE = "recordings";
const VERSION = 1;

type Row = {
  key: string;
  fileKey: string;
  sentenceId: number;
  blob: Blob;
  duration: number;
  createdAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("fileKey", "fileKey", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

const rowKey = (fileKey: string, sentenceId: number) => `${fileKey}::${sentenceId}`;

export async function saveRecording(
  fileKey: string,
  sentenceId: number,
  blob: Blob,
  duration: number
) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const row: Row = {
      key: rowKey(fileKey, sentenceId),
      fileKey,
      sentenceId,
      blob,
      duration,
      createdAt: Date.now(),
    };
    store.put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRecording(fileKey: string, sentenceId: number): Promise<Row | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(rowKey(fileKey, sentenceId));
    req.onsuccess = () => resolve((req.result as Row) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function listRecordedIds(fileKey: string): Promise<Set<number>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const index = tx.objectStore(STORE).index("fileKey");
    const req = index.getAll(fileKey);
    req.onsuccess = () => {
      const rows = (req.result as Row[]) ?? [];
      resolve(new Set(rows.map((r) => r.sentenceId)));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecording(fileKey: string, sentenceId: number) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(rowKey(fileKey, sentenceId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
