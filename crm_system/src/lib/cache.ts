/**
 * 簡單的內存緩存實現
 * 用於緩存頻繁查詢的數據
 */

interface CacheItem {
  data: unknown;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem>();
  private maxSize = 100; // 最大緩存項目數

  set(key: string, data: unknown, ttlMs = 5 * 60 * 1000): void { // 默認5分鐘
    // 如果緩存已滿，清除最舊的項目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value as string;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 檢查是否過期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理過期的緩存項目
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 創建全局緩存實例
const cache = new SimpleCache();

// 定期清理過期緩存（每5分鐘）
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

export default cache;