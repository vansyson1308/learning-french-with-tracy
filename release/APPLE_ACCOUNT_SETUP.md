# Apple account runbook (§34)

Owner-only steps. Nothing here can be done by the coding agent: enrollment,
payment, identity verification and legal agreements are personal acts.
Sources: `PUBLICATION_RESEARCH.md` (Apple, primary pages fetched 2026-09-02).

## Before you start — what to expect

- **Seller name.** For an individual membership Apple displays **your legal name** as the seller of the app on the App Store. There is no way to show a brand name instead without an organization enrollment (which needs a D-U-N-S number, a company domain and a website). Decide now whether you accept your legal name on the listing.
- **Fee.** 99 USD per membership year ("Prices may vary by region and are listed in local currency during the enrollment process"). It renews annually; if it lapses the app is removed from sale.
- **Free account limits.** Without the paid Program you can run the app on your own iPhone from Xcode only (10 App IDs, 3 devices, 7-day provisioning), and neither TestFlight nor the App Store is available.
- **Time.** Identity verification can take from minutes to a few days.

## Steps

1. **Apple Account with two-factor authentication.** Use the Apple Account you intend to keep for years; turn on 2FA in Settings → [your name] → Sign-In & Security.
2. **Enroll as an individual** at https://developer.apple.com/programs/enroll/ (or in the Apple Developer app on iPhone). Enter your **legal name** exactly as on your ID, a real address (no P.O. box), email and phone.
3. **Identity verification.** Apple may ask for a government ID photo in the Apple Developer app. Complete it.
4. **Pay the fee** and **accept the Apple Developer Program License Agreement**. Read the agreement yourself — the agent does not accept legal terms for you.
5. **Wait for the activation email**, then sign in to https://developer.apple.com/account/ and check **Certificates, Identifiers & Profiles** is available.
6. **App Store Connect agreements.** In App Store Connect → Agreements, Tax, and Banking, accept the **Paid Apps** agreement only if you ever plan to charge (v1 is free; the free-apps agreement is covered by the Program agreement). Fill in **no banking** unless required for your region — a free app needs none.
7. **Bundle identifier.** Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs → App → Description "Learning French with Tracy", Bundle ID **Explicit** = the confirmed identifier from `release/identity.json`. Capabilities: none needed (no push, no iCloud). This step is irreversible for the identifier string.
8. **App Store Connect app record.** App Store Connect → My Apps → **+** → New App: platform iOS, name "Learning French with Tracy" (if the name is taken, App Store Connect will say so — then use the alternate name recorded in `STORE_METADATA_FINAL.md`), primary language English (U.S.), bundle ID from step 7, SKU `learning-french-with-tracy-1`, full access. The **Apple ID** shown under General Information is the `ascAppId` to record in `eas.json` → `submit.production.ios.ascAppId` and in `release/identity.json`.
9. **App Store Connect API key** (for EAS Submit without passwords): Users and Access → Integrations → App Store Connect API → Team Keys → **+**, role **Admin** (or App Manager). Download the `.p8` **once**, note Key ID and Issuer ID. Store the key in a password manager; never in the repository (`.gitignore` already excludes `*.p8`).
10. **Signing.** Let EAS manage the distribution certificate and provisioning profile on the first `eas build --platform ios` (it asks for your Apple credentials once, interactively, on your own machine), or create them in Xcode. Do not paste Apple credentials into any CI secret.

## What the agent records afterwards

- `release/identity.json`: `ascAppId`, confirmation evidence.
- `eas.json`: `submit.production.ios.ascAppId`, `ascApiKeyId`, `ascApiKeyIssuerId` (key path stays local).
- `PUBLICATION_STATUS.md`: "Apple account: ACTIVE (date)".

## Later renewals

The membership renews every year; App Store Connect shows the date. Keep the Apple Account's payment method valid, or the app disappears from the store when the membership expires.
