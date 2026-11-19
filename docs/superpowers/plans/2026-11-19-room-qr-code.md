# Room QR Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Show QR" button in the room opens a modal with a QR code of the room URL.

**Architecture:** New `RoomQrModal` (native `<dialog>`, `qrcode.react` SVG) rendered from `TaskHeader` next to "Copy link".

**Tech Stack:** Next.js 16, React 19, Tailwind 4, `qrcode.react`, Jest + RTL.

**Spec:** `docs/superpowers/specs/2026-11-19-room-qr-code-design.md`

## Global Constraints

- No URL text under the QR; caption is exactly "Scan to vote".
- QR value = `window.location.href`.
- Button visible to all participants.

## Review Focus

- jsdom lacks `HTMLDialogElement.showModal/close` — tests must stub them.
- Backdrop click closes; click inside the dialog content does not.
- QR must stay scannable in dark theme — render on white background with quiet zone.

---

### Task 1: RoomQrModal component

**Files:**
- Create: `src/components/RoomQrModal.tsx`
- Test: `src/components/__tests__/RoomQrModal.test.tsx`

**Interfaces:**
- Produces: `RoomQrModal({ url, onClose }: { url: string; onClose: () => void }) — mounted only while open`

- [ ] Install `qrcode.react`.
- [ ] Tests: renders "Scan to vote" + QR svg when open; does not show URL text; ✕ button calls `onClose`; Esc (`cancel` event) calls `onClose`; backdrop click calls `onClose`, content click does not.
- [ ] Implement with `QRCodeSVG` (size 280, `marginSize` 2, white bg). `showModal()` on mount, `close()` on unmount.
- [ ] Run tests, commit.

### Task 2: Wire into TaskHeader

**Files:**
- Modify: `src/components/TaskHeader.tsx`
- Test: `src/components/__tests__/TaskHeader.test.tsx`

- [ ] Tests: "Show QR code" button exists; click opens dialog with "Scan to vote".
- [ ] Add button + `useState` for open; pass `window.location.href`.
- [ ] Run tests, lint, build; commit.
