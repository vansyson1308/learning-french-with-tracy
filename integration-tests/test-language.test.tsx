/**
 * P1c: the synthetic test language `xx` compiles into src/content/test-only
 * (never bundled) and its artifacts load through the SAME per-course
 * registry the app uses — proof that every content module is language-
 * neutral: profiles, capabilities, ids, lexicon index, concepts,
 * assessment, reception (with a generated tone asset), speech, writing and
 * interaction all resolve for a non-French course.
 */
import { COURSE_ARTIFACTS as TEST_ARTIFACTS } from "../src/content/test-only/artifacts";
import testProfiles from "../src/content/test-only/course-profiles.json";
import { ID_REGISTRIES as TEST_ID_REGISTRIES } from "../src/content/test-only/ids";
import { checkpointFor, checkpointOrder, objectiveFor, placementContent } from "../src/lib/assessment/content";
import { __registerCourseArtifactsForTests } from "../src/lib/content-registry";
import {
  __registerCourseProfileForTests,
  courseProfile,
  hasCapability,
  type CourseProfile,
} from "../src/lib/course-profile";
import { conceptFor } from "../src/lib/learning/concepts";
import { __registerIdRegistryForTests, itemIdFor, surfaceFor } from "../src/lib/learning/ids";
import { lexemeMetaFor } from "../src/lib/learning/lexicon-index";
import { interactionScenarioFor } from "../src/lib/interaction/content";
import { exampleTexts } from "../src/lib/lexicon/example-text";
import { clipAudioSource, clipFor, readingFor } from "../src/lib/reception/content";
import { speechItemFor } from "../src/lib/speech/content";
import { knownVocabulary, writingTaskFor } from "../src/lib/writing/content";

const COURSE = "xx-en";

beforeAll(() => {
  const profiles = (testProfiles as { profiles: Record<string, CourseProfile> }).profiles;
  __registerCourseProfileForTests(profiles[COURSE]);
  __registerCourseArtifactsForTests(COURSE, TEST_ARTIFACTS[COURSE]);
  __registerIdRegistryForTests("xx", TEST_ID_REGISTRIES.xx);
});

afterAll(() => {
  __registerCourseProfileForTests(null, COURSE);
  __registerCourseArtifactsForTests(COURSE, null);
  __registerIdRegistryForTests("xx", null);
});

describe("synthetic test language through the content registry", () => {
  it("has a profile with every capability derived from its artifacts", () => {
    const profile = courseProfile(COURSE);
    expect(profile.targetCode).toBe("xx");
    expect(profile.nativeCode).toBe("en");
    expect(profile.recognitionLocale).toBe("xx-XX");
    for (const capability of Object.keys(profile.capabilities) as (keyof CourseProfile["capabilities"])[]) {
      expect(hasCapability(COURSE, capability)).toBe(true);
    }
  });

  it("resolves stable ids and lexicon metadata with code-keyed examples", () => {
    expect(itemIdFor(COURSE, "ka tomo")).toBe("xx:w:tomo");
    expect(surfaceFor(COURSE, "xx:w:lira")).toBe("ki lira");
    const meta = lexemeMetaFor(COURSE, "xx:w:tomo");
    expect(meta?.gloss).toBe("the friend");
    expect(meta?.gender).toBe("masculine");
    expect(exampleTexts(COURSE, meta?.example)).toEqual({
      target: "Mi tomo na ka tomo.",
      native: "I am a friend of the friend.",
    });
  });

  it("resolves the concept with native text already flattened", () => {
    const concept = conceptFor(COURSE, "xx:concept:two-articles");
    expect(concept?.title).toBe("Two articles");
    expect(exampleTexts(COURSE, concept?.examples[0])).toEqual({ target: "ka tomo", native: "the friend" });
    expect(concept?.examples[0].note).toBe("masculine — ka");
  });

  it("resolves assessment content", () => {
    expect(objectiveFor(COURSE, "xx.obj.read.signs")?.canDo).toContain("short Testish sign");
    expect(checkpointOrder(COURSE)).toEqual(["xx.checkpoint.section-1"]);
    expect(checkpointFor(COURSE, "xx.checkpoint.section-1")?.title).toBe("Section 1 check");
    expect(placementContent(COURSE)?.stages[0].title).toBe("Basics");
  });

  it("resolves reception content and the generated tone asset", () => {
    expect(readingFor(COURSE, "xx.read.sign")?.supportGlossary[0].gloss).toBe("welcome");
    expect(clipFor(COURSE, "xx.clip.tomo")?.transcriptLines[0].text).toBe("ka tomo");
    // jest's asset transform turns require("…wav") into a module id/number.
    expect(clipAudioSource(COURSE, "xx.clip.tomo")).not.toBeNull();
  });

  it("resolves speech, writing and interaction content", () => {
    expect(speechItemFor(COURSE, "xx.speak.friend")?.prompt.instruction).toBe("Say that you are a friend.");
    expect(writingTaskFor(COURSE, "xx.write.friend")?.rubric.requiredSlots[0].description).toBe("that you are a friend");
    expect(knownVocabulary(COURSE).has("tomo")).toBe(true);
    expect(interactionScenarioFor(COURSE, "xx.scenario.hello")?.goal).toBe("Say you are a friend, then say goodbye.");
  });

  it("never leaks into the shipped registry", () => {
    __registerCourseArtifactsForTests(COURSE, null);
    __registerCourseProfileForTests(null, COURSE);
    expect(hasCapability(COURSE, "lexicon")).toBe(false);
    expect(conceptFor("fr-en", "xx:concept:two-articles")).toBeUndefined();
    const profiles = (testProfiles as { profiles: Record<string, CourseProfile> }).profiles;
    __registerCourseProfileForTests(profiles[COURSE]);
    __registerCourseArtifactsForTests(COURSE, TEST_ARTIFACTS[COURSE]);
  });
});
