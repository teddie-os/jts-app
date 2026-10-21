// Sends one test notification to a device.
// Usage: node tools/send-test.mjs device-code.json ["Title"] ["Body"]
// The device code is what the app's "Copy code" button gives you.
import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";

const here = path.dirname(new URL(import.meta.url).pathname);
const keys = JSON.parse(fs.readFileSync(path.join(here, "../.local/vapid.json"), "utf8"));
const [file, title = "Just Talk Studios", body = "This is your test reminder. If you can read this, reminders work."] = process.argv.slice(2);
if (!file) { console.error("Which device? Pass the file holding its code."); process.exit(1); }

webpush.setVapidDetails("mailto:hello@justtalkstudios.com", keys.publicKey, keys.privateKey);
const device = JSON.parse(fs.readFileSync(file, "utf8"));
const res = await webpush.sendNotification(device, JSON.stringify({ title, body }));
console.log("Sent:", res.statusCode);
