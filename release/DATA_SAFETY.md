# Google Play Data safety — draft declaration (Phase 10 §46)

Source of truth: `PRIVACY_INVENTORY.md`. The authoritative Play Console
help article ("Provide information for Google Play's Data safety section")
was not reachable from this environment; the definitions below are from
developer.android.com (rendered) and search-visible Play Console text, and
are marked **VERIFY AT SUBMISSION**.

Definitions relied on:
- Collection = transmitting data off the user's device (Play Console
  definition; on-device-only processing is not collection).
- "Processed ephemerally" = held only in memory and no longer than needed to
  service the request in real time; such transfers are entered in the form
  but not shown as collected.
- Any data collected or shared by a third-party SDK in the app must be
  declared (developer.android.com, rendered).

## Draft form answers

| Question | Answer | Basis |
|---|---|---|
| Does your app collect or share any of the required user data types? | **No** | No network code in the app; no analytics/ads/crash SDKs; progress stays in app-private storage |
| Is all of the user data collected by your app encrypted in transit? | n/a (nothing collected) | — |
| Do you provide a way for users to request that their data is deleted? | n/a for collected data; policy states deleting the app removes all local data | `PRIVACY_POLICY.md` |
| Data types — Audio ("Voice or sound recordings") | The app declares `RECORD_AUDIO` and captures audio only after the user taps record; audio is handed to the Android speech recognizer (an OS component / Google app service selected by the system), which may process it off device under Google's terms; the developer never receives, stores or shares the audio | Declare **no collection by the developer**; explain in the "app functionality" description; **VERIFY** whether Play requires listing Audio as "collected — ephemeral" when the OS recognizer is network-backed |
| Data types — App activity, App info & performance, Files & docs, Personal info, Messages, Photos/videos, Contacts, Location, Financial, Health, Calendar, Device IDs | none | not read; no SDKs |
| Security practices — independent security review | not applicable / no | — |
| Government / children | not directed at children; no personal data collected | — |

## Permissions the form and the listing must agree with

`RECORD_AUDIO` (runtime prompt, speech practice), `MODIFY_AUDIO_SETTINGS`,
`INTERNET` (framework default; no requests), `VIBRATE`. No foreground
service, no background microphone, no storage permissions — all removed in
Phase 10 and verified on the merged manifest.

## Internal testing vs production

- **Internal testing** (up to 100 testers, closed link): the Data safety
  form does not have to be complete before an internal-test upload, but it
  must be complete and accurate before promotion to closed/open testing or
  production, and the privacy-policy URL is required for any listing that
  requests `RECORD_AUDIO`. **VERIFY AT SUBMISSION** against the current
  Play Console prompts.
- **Production**: full Data safety form, privacy-policy URL, target API 36
  (met), and the app-access / content-rating questionnaires.

## Owner-supplied items

- Privacy policy URL (text: `release/PRIVACY_POLICY.md`).
- Developer contact email shown on the listing.
