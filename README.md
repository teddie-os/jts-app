# JTS app (test build)

An installable app for Just Talk Studios clients. It frames the client portal
(www.justtalkstudios.com/portal) and adds the two things Wix blocks: installing
to a phone or computer, and notifications.

These files are public on purpose. Nothing private lives here; client data stays
in teddie on Wix, behind sign-in.

- `index.html`, `app.js`, `app.css`: the shell page and its install and reminder prompts
- `manifest.webmanifest`, `icons/`: the app's name and icon
- `sw.js`: the background script that shows notifications
- `tools/send-test.mjs`: sends a test notification from this Mac. The private push key
  lives in `.local/`, which is never committed.
