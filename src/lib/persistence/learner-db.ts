/**
 * Web resolution of the learner-store opener (P1d): expo-sqlite's web
 * backend needs wasm + SharedArrayBuffer, which this app does not require,
 * so web keeps learner data in one AsyncStorage JSON document behind the
 * same interface. Metro picks ./learner-db.native.ts on iOS/Android.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { JsonLearnerStore } from "./learner-json";
import type { LearnerStore } from "./learner-types";

export async function openLearnerStore(): Promise<LearnerStore> {
  return new JsonLearnerStore(AsyncStorage);
}
