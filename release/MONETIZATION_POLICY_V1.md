# Monetization policy — v1 (§8)

| Item | v1 |
|---|---|
| Price | **Free** on iOS and Android |
| Advertisements | **None** — no ad SDK exists in the dependency tree (verified in `SECURITY_AUDIT.md`); Play "Contains ads" = No |
| In-app purchases | **None** |
| Subscriptions | **None** |
| Sponsorship integration | **None** |
| Tracking / attribution SDK | **None** |
| Analytics SDK | **None** |
| AI tutor | **Disabled** (seam only; no key, endpoint or network call) |

Any future advertising, sponsorship, analytics or AI feature must trigger,
before implementation: a privacy review (`PRIVACY_INVENTORY.md`), an App
Privacy re-declaration, a Data safety re-declaration, a consent review, a
"Contains ads" declaration change, and a store-metadata review. These are
post-v1 product decisions, not part of this release.
