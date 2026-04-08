const fs = require("fs");
const path = "references/klædeskabet.html";
const t = fs.readFileSync(path, "utf8");
const lines = t.split(/\r?\n/);
const pre = lines.slice(191, 266).join("\n"); // 192-266: constants through heldMisc
const items = lines.slice(266, 1205).join("\n"); // ITEMS=[ ... ];
const out = `/* eslint-disable */\n/**\n * Extracted from references/klædeskabet.html — wardrobe item definitions.\n * svgAvatar functions close over HAND_L_X etc.\n */\n${pre}\n\nexport const WARDROBE_ITEMS = ${items.replace(/^const ITEMS=\[/, "[")}`;
fs.writeFileSync("src/data/wardrobeItems.generated.ts", out, "utf8");
console.log("written", out.length);
