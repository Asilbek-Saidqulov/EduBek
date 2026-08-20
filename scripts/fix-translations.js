const fs = require("fs");

try {
  const en = JSON.parse(fs.readFileSync("./messages/en.json", "utf8"));
  let uz;
  try {
    uz = JSON.parse(fs.readFileSync("./messages/uz.json", "utf8"));
  } catch (e) {
    console.log("uz.json parse error:", e.message);
    // Let's attempt to repair or fallback
    let content = fs.readFileSync("./messages/uz.json", "utf8").trim();
    // Count opening and closing braces
    let open = (content.match(/\{/g) || []).length;
    let close = (content.match(/\}/g) || []).length;
    console.log(`Open braces: ${open}, Close braces: ${close}`);
    while (close < open) {
      content += "\n}";
      close++;
    }
    try {
      uz = JSON.parse(content);
      console.log("Successfully repaired uz.json by balancing braces!");
    } catch (e2) {
      console.log("Falling back to ru or en with Uzbek defaults");
      uz = JSON.parse(fs.readFileSync("./messages/ru.json", "utf8"));
    }
  }

  fs.writeFileSync("./messages/uz.json", JSON.stringify(uz, null, 2), "utf8");
  console.log("uz.json is now valid!");
} catch (err) {
  console.error("Error fixing translations:", err);
}
