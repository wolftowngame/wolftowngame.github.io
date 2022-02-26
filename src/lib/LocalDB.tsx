import { Config } from 'src/Config';
import { Wolf } from 'src/types/wolf';

class MyIndexedDB {
  db!: IDBDatabase;
  table = `URI`;
  name = `${Config.Contract.Wolf}`;
  mounted: Promise<any>;
  constructor() {
    const request = window.indexedDB.open(this.name, 2);
    this.mounted = new Promise((resolve, reject) => {
      request.onsuccess = (event: any) => {
        console.log('request.onsuccess', event, request);
        this.db = request.result;
        resolve(null);
      };
      request.onupgradeneeded = (event: any) => {
        console.log('request.onupgradeneeded', event, request);
        this.db = event.target.result;
        this.checkTable();
      };
      request.onerror = (event) => {
        reject(event);
      };
    });
  }
  checkTable() {
    if (!this.db.objectStoreNames.contains(this.table)) {
      this.db.createObjectStore(this.table, { keyPath: 'name' });
    }
  }

  async setItem(value: any) {
    await this.mounted;
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(this.table, 'readwrite').objectStore(this.table).put(value);
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  }

  async getItem(key: string): Promise<Wolf | null> {
    await this.mounted;
    return new Promise((resolve, reject) => {
      const request = this.db.transaction([this.table]).objectStore(this.table).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  }

  async removeItem(key: string) {
    await this.mounted;
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(this.table, 'readwrite').objectStore(this.table).delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  }

  async key(index: number) {
    await this.mounted;
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(this.table).objectStore(this.table).getAllKeys();
      request.onsuccess = () => resolve(request.result[index]);
      request.onerror = reject;
    });
  }

  async keys(): Promise<string[]> {
    await this.mounted;
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(this.table).objectStore(this.table).getAllKeys();
      request.onsuccess = () => resolve(request.result as any);
      request.onerror = reject;
    });
  }

  async clear() {
    await this.mounted;
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(this.table, 'readwrite').objectStore(this.table).clear();
      request.onsuccess = () => resolve(null);
      request.onerror = reject;
    });
  }
}

export const MyURICache = new MyIndexedDB();
