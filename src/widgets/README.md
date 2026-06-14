# Home screen widgets

## Architecture

| Platform | Configuration | Data |
|----------|---------------|------|
| **iOS 17+** | Long press → Edit Widget (`AppIntentConfiguration`) | App Group: `moments-catalog.json`, `snapshots/{id}.json` |
| **Android** | Long press → Configure activity, or tap placeholder | AsyncStorage bindings + snapshots |

The main app calls `syncAllWidgets()` after load and when moments change. That rebuilds the catalog and snapshot files, then reloads widget UIs.

## iOS flow

1. `syncWidgetCatalog` writes catalog + per-moment JSON into the App Group.
2. `WidgetMomentConfigurationIntent` stores **Display** (recent / specific) and optional **Moment** per widget instance.
3. `PreviewProvider` resolves the moment id and loads the matching snapshot file.
4. Unconfigured placeholders: iOS — “Press and hold, then Edit Widget…”; Android — “Tap or press and hold, then Widget settings…”. iOS placeholders are not tappable; configured widgets open `timekeeper://moment/{id}`.

## Android flow

1. `widgetBindings` maps `widgetId` → `momentId`.
2. `previewWidgetHandler` renders from cached snapshots.
3. `WidgetConfigurationEntry` binds a moment when the user configures.

## Native bridge (iOS)

`WidgetSnapshotBridge`: `setSnapshotForMoment`, `removeSnapshotForMoment`, `setCatalogJson`, `setImageForMoment`, `removeImageForMoment`, `reloadTimelines`, `setProState`.

Background images: the picked photo is downscaled (`widgetImageService`) and, on
iOS, copied into the App Group `widget-images/` dir (the widget can't read the
app's private storage); on Android it's embedded as a base64 `data:` URI in the
snapshot. The widget draws it with a dark scrim so white text stays readable.

Rebuild native code after bridge changes: `yarn ios`.

## Pro gating (multiple widgets)

Free users get one widget (`FREE_WIDGET_LIMIT`); more is a Pro feature.

- **Android:** `WidgetSlotGate` wraps the config picker. Re-configuring an
  already-bound widget is allowed; binding a *new* widget beyond the limit shows
  an upgrade notice instead of the picker. Pro state is read from the cached
  entitlement (`isProCached`).
- **iOS:** the widget extension can't run the picker, so gating is flag-based.
  `setProState(isPro)` stores the entitlement in the App Group and, for non-Pro
  users, counts placed widgets via `WidgetCenter.getCurrentConfigurations`; if
  more than one exists it sets `widgetsLocked`. The widget reads that flag and
  renders an upgrade notice. Recomputed on launch / entitlement change
  (`ProProvider` → `setWidgetProStateOnIos`).

## Refresh cadence

Widgets are **not** live tickers — the OS refreshes them on its own schedule, so
seconds are never shown. **Minutes is the smallest unit** in a widget; seconds
appear only on the moment detail screen.

`widgetRefreshSeconds()` (in `widgetSnapshot.ts`) requests how often a snapshot
should be regenerated based on the displayed unit:

| Displayed unit | Requested refresh |
|----------------|-------------------|
| minutes (incl. auto < 1h, or the "seconds" unit shown as minutes) | ~60 s |
| hours (incl. auto < 1 day) | ~5 min |
| days and larger | ~15 min |

These are *requests*. Reality per platform:

- **iOS (WidgetKit):** the timeline policy asks for the next refresh, but the
  system enforces a daily budget (~40–70 refreshes/day). A minute-level widget
  will update roughly every several minutes in practice, more often when the app
  was recently foregrounded — not every 60 s.
- **Android:** `updatePeriodMillis` is 0 (disabled); refreshes happen when the
  app calls `syncAllWidgets()` (on launch / when moments change) and on the
  launcher's own redraws.

Because exact-minute precision isn't guaranteed, the widget rounds up to a
minimum of **"1 minute"** rather than ever showing "0".
