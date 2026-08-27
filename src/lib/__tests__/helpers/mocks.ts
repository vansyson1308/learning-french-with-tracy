/** Shared in-memory doubles used by setup.ts module mocks and by tests. */

export const memoryStorage = new Map<string, string>();

export const asyncStorageMock = {
  /** When true, the next setItem call throws (simulates an interrupted write). */
  failNextSet: false,
  async getItem(key: string): Promise<string | null> {
    return memoryStorage.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (asyncStorageMock.failNextSet) {
      asyncStorageMock.failNextSet = false;
      throw new Error("simulated storage failure");
    }
    memoryStorage.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    memoryStorage.delete(key);
  },
};

/** In-memory stand-in for expo-file-system files, keyed by uri. */
export const memFiles = new Map<string, string>();
