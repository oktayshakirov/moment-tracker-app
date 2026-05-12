/**
 * Loads `.env` before Expo merges static config. Ensures `EXPO_PUBLIC_*` vars
 * are available when Metro and native tooling run (including `expo run:android`).
 *
 * Do not put API secrets in `expo.extra` or any field that gets written into
 * native manifests/plists — Unsplash **Secret Key** must never ship in the app.
 */
require("dotenv").config();

module.exports = require("./app.json");
