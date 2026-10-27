import { mock } from "bun:test";

import { ALL_COURSE_BUNDLES } from "../../content/course-bundles";
import { registerCourseBundle } from "../course-bundle";

import { asyncStorageMock, joinMockUri, memDirs, memFiles } from "./helpers/mocks";

mock.module("@react-native-async-storage/async-storage", () => ({
  default: asyncStorageMock,
}));

mock.module("expo-file-system", () => {
  class MockFile {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = joinMockUri(parts);
    }
    get exists(): boolean {
      return memFiles.has(this.uri);
    }
    create() {}
    write(content: string) {
      memFiles.set(this.uri, content);
    }
    delete() {
      if (!memFiles.delete(this.uri)) throw new Error(`no such file: ${this.uri}`);
    }
    async text(): Promise<string> {
      const value = memFiles.get(this.uri);
      if (value === undefined) throw new Error(`no such file: ${this.uri}`);
      return value;
    }
  }
  class MockDirectory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = joinMockUri(parts);
    }
    get exists(): boolean {
      const prefix = `${this.uri}/`;
      if (memDirs.has(this.uri)) return true;
      for (const key of memFiles.keys()) if (key.startsWith(prefix)) return true;
      return false;
    }
    create() {
      memDirs.add(this.uri);
    }
    /** Direct children only (the speech cache is flat, like the real one). */
    list(): MockFile[] {
      if (!this.exists) throw new Error(`no such directory: ${this.uri}`);
      const prefix = `${this.uri}/`;
      const children: MockFile[] = [];
      for (const key of memFiles.keys()) {
        if (key.startsWith(prefix) && !key.slice(prefix.length).includes("/")) {
          children.push(new MockFile(key));
        }
      }
      return children;
    }
    delete() {
      const prefix = `${this.uri}/`;
      for (const key of [...memFiles.keys()]) if (key.startsWith(prefix)) memFiles.delete(key);
      memDirs.delete(this.uri);
    }
  }
  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: { cache: { uri: "cache" }, document: { uri: "document" } },
  };
});

mock.module("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US", languageCode: "en", regionCode: "US" }],
}));

mock.module("expo-sharing", () => ({
  isAvailableAsync: async () => true,
  shareAsync: async () => {},
}));

mock.module("expo-document-picker", () => ({
  getDocumentAsync: async () => ({ canceled: true, assets: null }),
}));

// P3g: course content is loaded on demand in the app (src/lib/course-bundle.ts);
// tests and scripts register every bundle up front.

for (const bundle of ALL_COURSE_BUNDLES) registerCourseBundle(bundle);
