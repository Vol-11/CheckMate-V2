// IndexedDB設定
const DB_NAME = 'wasuremonoPro';
const DB_VERSION = 6; 
const ITEMS_STORE_NAME = 'items';
const CATEGORIES_STORE_NAME = 'categories';
const FORGOTTEN_RECORDS_STORE_NAME = 'forgotten_records';
const DATE_OVERRIDES_STORE_NAME = 'date_overrides'; 
let db;

const dbReadyPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
        db = request.result;
        resolve(db);
    };
    request.onupgradeneeded = e => {
        db = e.target.result;
        // アイテムストア
        if (!db.objectStoreNames.contains(ITEMS_STORE_NAME)) {
            const itemStore = db.createObjectStore(ITEMS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            itemStore.createIndex('category', 'category', { unique: false });
            itemStore.createIndex('name', 'name', { unique: false });
            itemStore.createIndex('code', 'code', { unique: false });
        }
        // カテゴリストア
        if (!db.objectStoreNames.contains(CATEGORIES_STORE_NAME)) {
            const categoryStore = db.createObjectStore(CATEGORIES_STORE_NAME, { keyPath: 'id' });
            categoryStore.createIndex('name', 'name', { unique: true });
        }
        // 忘れ物記録ストア (dateをキーにする)
        if (!db.objectStoreNames.contains(FORGOTTEN_RECORDS_STORE_NAME)) {
            const forgottenStore = db.createObjectStore(FORGOTTEN_RECORDS_STORE_NAME, { keyPath: 'date' });
            forgottenStore.createIndex('date_idx', 'date', { unique: true });
        }
        // 日付オーバーライドストア (dateをキーにする)
        if (!db.objectStoreNames.contains(DATE_OVERRIDES_STORE_NAME)) {
            db.createObjectStore(DATE_OVERRIDES_STORE_NAME, { keyPath: 'date' });
        }
    };
});

function openDB() {
    return dbReadyPromise;
}

// アイテム CRUD操作
async function addItem(item) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllItems() {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readonly');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateItem(item) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteItem(id) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearItems() {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// カテゴリ CRUD操作
async function addCategory(category) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const request = store.add(category);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllCategories() {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteCategory(id) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearCategories() {
    await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CATEGORIES_STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// 忘れ物記録 CRUD操作
async function addForgottenRecord(record) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.put(record); // dateがキーなので、同じ日付は上書きされる
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllForgottenRecords() {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readonly');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearForgottenRecords() {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteForgottenRecord(date) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.delete(date);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteForgottenRecordsBefore(date) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.openCursor();
    request.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) {
        if (new Date(cursor.key) < date) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 日付オーバーライド CRUD操作
async function getOverride(date) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATE_OVERRIDES_STORE_NAME, 'readonly');
    const store = tx.objectStore(DATE_OVERRIDES_STORE_NAME);
    const request = store.get(date);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveOverride(override) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATE_OVERRIDES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DATE_OVERRIDES_STORE_NAME);
    const request = store.put(override);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteOverride(date) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATE_OVERRIDES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DATE_OVERRIDES_STORE_NAME);
    const request = store.delete(date);
    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Error deleting override:', request.error);
        reject(request.error);
    };
  });
}
