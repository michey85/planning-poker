# Room QR Code — Design

**Intent:** during in-person estimation the moderator shows a QR code (e.g. on a projector); participants scan it and vote from their phones.

**Goals:** "Show QR" button in the room that opens a modal with a large QR of the current room URL.
**Non-goals:** separate mobile voting mode (layout is already responsive); showing the URL under the QR.

**Approaches:**
- `qrcode.react` (client-side SVG) — **chosen**: tiny, no network, crisp at any size.
- External QR image API — rejected: leaks room ID to a third party, needs network.
- Hand-rolled encoder — rejected: needless complexity.

**Design:**
- Button "Show QR" next to "Copy link" in `TaskHeader`, visible to everyone.
- New `RoomQrModal` component: native `<dialog>` with large QR (`window.location.href`) and caption "Scan to vote"; closes on Esc, backdrop click, and ✕ button.
- Tests: open/close behaviour, QR encodes current URL.

**Constraint:** in `npm run dev` the URL is `localhost`; phones need the machine's LAN IP.
