// The app shell. The portal itself is the framed page; this file only handles
// the two things the portal can't do from inside Wix: installing the app and
// turning on reminders.

(function () {
  // Public half of the push key pair. The private half never leaves the sending machine.
  var PUSH_KEY = "BLOnE_6LQi9_Ldem5xKoATCpm3DwFpkYItfuPm2_vED4OOJOTXXC-yXCfR4O6piBrpZ9ZnIdKM6NdkOyxWTnOr4";
  var SNOOZE_DAYS = 7;

  var bar = document.getElementById("bar");
  var title = document.getElementById("bar-title");
  var text = document.getElementById("bar-text");
  var go = document.getElementById("bar-go");
  var later = document.getElementById("bar-later");

  var installed = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  var ua = navigator.userAgent;
  var iOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  var canPush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  var installPrompt = null;
  var registration = null;

  function remember(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } }
  function recall(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function snoozed(step) { var t = Number(recall("snooze:" + step)); return t && Date.now() - t < SNOOZE_DAYS * 864e5; }

  function show(step, heading, body, action, onGo) {
    if (snoozed(step)) { bar.hidden = true; return; }
    title.textContent = heading;
    text.textContent = body;
    go.hidden = !action;
    go.textContent = action || "";
    go.onclick = onGo || null;
    later.textContent = action ? "Not now" : "Got it";
    later.onclick = function () { remember("snooze:" + step, String(Date.now())); bar.hidden = true; };
    bar.hidden = false;
  }

  function keyBytes(base64) {
    var padded = (base64 + "===".slice((base64.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/");
    var raw = atob(padded);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  // The portal lives in the frame. It says "ready" once somebody is signed in; the shell
  // answers with this device's push address, which teddie keeps against that member.
  // Only the portal's own origin is spoken to, and only its messages are heard.
  var PORTAL_ORIGIN = "https://www.justtalkstudios.com";
  var frame = document.getElementById("portal");
  var portalReady = false;

  async function handDeviceToPortal() {
    if (!portalReady || !registration || !frame || !frame.contentWindow) return;
    if (Notification.permission !== "granted") return;
    var sub = await registration.pushManager.getSubscription();
    if (!sub) return;
    var label = (iOS ? "iPhone or iPad" : /Android/.test(ua) ? "Android" : /Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "device") + (installed ? " app" : " browser");
    frame.contentWindow.postMessage({ type: "jts-device", subscription: sub.toJSON(), label: label }, PORTAL_ORIGIN);
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== PORTAL_ORIGIN || !event.data || event.data.type !== "jts-portal-ready") return;
    portalReady = true;
    handDeviceToPortal();
  });

  // A reminder tapped on the phone carries the screen it is about; the frame opens there.
  if (frame && window.location.search.length > 1) {
    frame.src = PORTAL_ORIGIN + "/portal" + window.location.search + "&app=1";
  }

  async function turnOnReminders() {
    var answer = await Notification.requestPermission();
    if (answer !== "granted") { bar.hidden = true; return; }
    await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUSH_KEY) });
    await handDeviceToPortal();
    show("reminders-on", "Reminders are on", "The day before a session, and the moment an episode is ready for you.");
  }

  async function decide() {
    if (!installed && installPrompt) {
      return show("install", "Get the JTS app", "One tap back to your sessions and episodes, plus reminders.", "Install", async function () {
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        bar.hidden = true;
      });
    }
    if (!installed && iOS) {
      return show("install-ios", "Add JTS to your Home Screen", "Tap the Share button, then Add to Home Screen. Reminders work once it's there.");
    }
    if (!canPush || !registration) return;
    if (iOS && !installed) return;
    if (Notification.permission === "default") {
      return show("reminders", "Turn on reminders", "We'll let you know the day before a session and when an episode is ready for you.", "Turn on", turnOnReminders);
    }
    if (Notification.permission === "granted") handDeviceToPortal();
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    installPrompt = e;
    decide();
  });
  window.addEventListener("appinstalled", function () { installed = true; bar.hidden = true; });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(function (r) { registration = r; decide(); }, function () { decide(); });
  } else {
    decide();
  }
})();
