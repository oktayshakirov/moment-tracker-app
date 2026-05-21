import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import {
  registerWidgetConfigurationScreen,
  registerWidgetTaskHandler,
} from "react-native-android-widget";
import { previewWidgetHandler } from "./src/widgets/previewWidgetHandler";
import { WidgetConfigurationEntry } from "./src/widgets/WidgetConfigurationEntry";

registerWidgetTaskHandler(previewWidgetHandler);
registerWidgetConfigurationScreen(WidgetConfigurationEntry);

import App from "./src/app/App";

registerRootComponent(App);
