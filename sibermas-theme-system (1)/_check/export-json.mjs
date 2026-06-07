import { writeFileSync } from "node:fs"
import { THEMES } from "../apps/web/src/lib/theme-config.ts"
writeFileSync(new URL("./themes.json", import.meta.url), JSON.stringify(THEMES, null, 2), "utf8")
console.log("themes.json written: " + THEMES.length + " themes")
