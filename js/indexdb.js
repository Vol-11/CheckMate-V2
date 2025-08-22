// IndexedDB設定
const DB_NAME = 'wasuremonoPro';
const DB_VERSION = 6; // DBバージョンを更新
const ITEMS_STORE_NAME = 'items';
const CATEGORIES_STORE_NAME = 'categories';
const FORGOTTEN_RECORDS_STORE_NAME = 'forgotten_records';
const DATE_OVERRIDES_STORE_NAME = 'date_overrides'; // New store
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { db = request.result; resolve(db); };
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
}

// アイテム CRUD操作
function addItem(item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readonly');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function updateItem(item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteItem(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearItems() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// カテゴリ CRUD操作
function addCategory(category) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const request = store.add(category);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllCategories() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteCategory(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearCategories() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CATEGORIES_STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// 忘れ物記録 CRUD操作
function addForgottenRecord(record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.put(record); // dateがキーなので、同じ日付は上書きされる
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllForgottenRecords() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readonly');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function clearForgottenRecords() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteForgottenRecord(date) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.delete(date);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteForgottenRecordsBefore(date) {
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
function getOverride(date) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATE_OVERRIDES_STORE_NAME, 'readonly');
    const store = tx.objectStore(DATE_OVERRIDES_STORE_NAME);
    const request = store.get(date);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveOverride(override) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATE_OVERRIDES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DATE_OVERRIDES_STORE_NAME);
    const request = store.put(override);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}