import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // single-page app: most slices are naturally used from one place for now
      "fsd/insignificant-slice": "off",
    },
  },
  {
    // `providers` is the conventional name for the app layer's provider setup
    files: ["./src/app/**"],
    rules: { "fsd/segments-by-purpose": "off" },
  },
]);
