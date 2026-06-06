import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/** Only routes into the main app — widget-picker is handled by {@link WidgetConfigureShell}. */
export const rootLinking: LinkingOptions<RootStackParamList> = {
  prefixes: ["momenttracker://"],
  config: {
    screens: {
      Home: "",
      MomentDetail: "moment/:momentId",
      MomentForm: "moment-form",
    },
  },
};
