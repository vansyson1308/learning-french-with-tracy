import { mock } from "bun:test";

import { asyncStorageMock, memFiles } from "./helpers/mocks";

mock.module("@react-native-async-storage/async-storage", () => ({
  default: asyncStorageMock,
}));

mock.module("expo-file-system", () => {
  class MockFile {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = parts
        .map((p) =>
          typeof p === "string" ? p : ((p as { uri?: string })?.uri ?? "")
        )
        .join("/");
    }
    create() {}
    write(content: string) {
      memFiles.set(this.uri, content);
    }
    async text(): Promise<string> {
      const value = memFiles.get(this.uri);
      if (value === undefined) throw new Error(`no such file: ${this.uri}`);
      return value;
    }
  }
  return {
    File: MockFile,
    Paths: { cache: { uri: "cache" }, document: { uri: "document" } },
  };
});

mock.module("expo-sharing", () => ({
  isAvailableAsync: async () => true,
  shareAsync: async () => {},
}));

mock.module("expo-document-picker", () => ({
  getDocumentAsync: async () => ({ canceled: true, assets: null }),
}));
