import { Config } from "./src/config/config.ts";

console.log("Testing config loading...");

try {
  const config = await Config.get();
  console.log("Config loaded successfully:");
  console.log("- Model:", config.model);
  console.log("- Providers:", Object.keys(config.provider || {}));
  if (config.provider?.polza) {
    console.log("- Polza models:", Object.keys(config.provider.polza.models || {}));
  }
} catch (error) {
  console.error("Config loading failed:", error);
}