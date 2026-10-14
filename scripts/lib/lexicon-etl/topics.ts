/**
 * Topic assignment (P3a): kaikki topical category names (`es:Fruits` →
 * "fruits") and sense topics ("transport") are mapped onto the project's
 * `TOPIC_VALUES`. The table is deliberately small and literal — a raw
 * label that matches nothing falls back to "everyday" and is reported in
 * REVIEW.md, never guessed from the gloss text.
 */

import type { TopicValue } from "../../../content/schema";

const RULES: [RegExp, TopicValue][] = [
  [/^(family|family members|parents|children|relatives)$/, "family"],
  [/^(people|male people|female people|occupations|nationalities|demonyms|titles|professions|employment)$/, "people"],
  [/^(greetings|farewells|politeness|interjections)$/, "greetings"],
  [/^(food|foods|food and drink|beverages|drinks|cooking|fruits|vegetables|meats|breads|dairy products|desserts|spices and herbs|nuts|alcoholic beverages|cuisine|seafood|cereals|grains|pome fruits|berries|citrus fruits|meals|condiments|sweets|confectionery)$/, "food"],
  [/^(animals|mammals|dogs|cats|birds|fish|insects|reptiles|amphibians|pets|livestock|poultry|rodents|primates|equids|canids|felids|bovines|ovines|suids|cetaceans|arachnids|mollusks|crustaceans|zoology|animal sounds|baby animals|ungulates|lagomorphs)$/, "animals"],
  [/^(travel|transport|transportation|vehicles|aviation|nautical|railways|roads|automotive|automobiles|aircraft|watercraft|cycling|tourism|hotels|navigation)$/, "travel"],
  [/^(places|cities|countries|geography|buildings|rooms|house|home|furniture|architecture|urban|regions|continents|villages|toponyms|landforms|streets|shops|stores)$/, "places"],
  [/^(shopping|commerce|business|money|currency|finance|economics|trade|retail|banking|markets|marketing|advertising|payment)$/, "shopping"],
  [/^(time|days of the week|months|seasons|calendar|periodic occurrences|units of time|timekeeping|holidays|periods of time)$/, "time"],
  [/^(body|anatomy|body parts|hair|face|hands|bodily functions|medicine|health|diseases|pathology|healthcare|hygiene|illness)$/, "body"],
  [/^(clothing|clothes|footwear|headwear|fashion|textiles|fabrics|jewelry|accessories)$/, "clothing"],
  [/^(colors|colours)$/, "colors"],
  [/^(numbers|cardinal numbers|ordinal numbers|mathematics|arithmetic|quantity|units of measure)$/, "numbers"],
  [/^(weather|atmospheric phenomena|climate|meteorology|precipitation|wind)$/, "weather"],
  [/^(nature|plants|trees|flowers|botany|landscapes|water|sea|bodies of water|rivers|mountains|forests|natural-sciences|ecology|environment|sky|celestial bodies|minerals|stones|earth|fire|light|sun|moon|stars|gardening|agriculture|farming)$/, "nature"],
  [/^(work|jobs|office|tools|industry|crafts|engineering|labour|labor|workplace|construction|manufacturing)$/, "work"],
  [/^(school|education|learning|writing|reading|literature|books|grammar|linguistics|languages|publishing|science|sciences|academia|universities)$/, "school"],
  [/^(emotions|feelings|love|personality|character|psychology|mental states|mind|thought|virtue|vice)$/, "feelings"],
  [/^(sports|games|music|hobbies|entertainment|leisure|arts|art|dance|cinema|film|theater|theatre|television|media|toys|ball-games|soccer|football|musical instruments|photography|recreation|board games|card games|video games|broadcasting|radio)$/, "leisure"],
  [/^(government|politics|law|military|war|religion|philosophy|history|society|economy|crime|justice|ideas|abstract|ethics|morality|monarchy|nobility|christianity|islam|buddhism)$/, "ideas"],
  [/^(technology|computing|internet|telecommunications|electronics|communication|mail|post|telephony|software|hardware|machines|energy|electricity)$/, "technology"],
  [/^(household|housework|cleaning|kitchen|kitchenware|appliances|containers|tableware|cookware|bathroom|bedroom|dwellings|everyday life|daily life|objects|materials|lighting)$/, "home"],
];

/** Map raw labels to a project topic; first matching label in priority order wins. */
export function projectTopicFor(rawTopics: readonly string[]): { topic: TopicValue; matched: string | null } {
  for (const [re, topic] of RULES) {
    for (const raw of rawTopics) {
      if (re.test(raw)) return { topic, matched: raw };
    }
  }
  return { topic: "everyday", matched: null };
}
