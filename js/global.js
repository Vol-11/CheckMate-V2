// グローバル変数
let items = [];
let categories = []; // カテゴリリストを保持するグローバル変数
let currentDay = null;
let currentCategory = 'all';
let sortBy = 'name';
let isScanning = false;
let isCheckScanning = false;
let editingItem = null;
let checkMode = 'manual';
let scanResults = new Map();
