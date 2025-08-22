// IndexedDB設定
const DB_NAME = 'wasuremonoPro';
const DB_VERSION = 3; // DBバージョンを更新
const ITEMS_STORE_NAME = 'items';
const CATEGORIES_STORE_NAME = 'categories';
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
        const store = db.createObjectStore(ITEMS_STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('code', 'code', { unique: false });
      }
      // カテゴリストア
      if (!db.objectStoreNames.contains(CATEGORIES_STORE_NAME)) {
        const store = db.createObjectStore(CATEGORIES_STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: true });
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
