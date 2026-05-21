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

`WidgetSnapshotBridge`: `setSnapshotForMoment`, `removeSnapshotForMoment`, `setCatalogJson`, `reloadTimelines`.

Rebuild native code after bridge changes: `yarn ios`.
