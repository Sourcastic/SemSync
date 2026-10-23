# SemSync Demo Guide

A script for presenting SemSync and recording backup clips.

## Before you start

1. Run `npm run dev` from the project root (sync server on 3030, app on `http://localhost:5173`).
2. Open two browser windows side by side:
   - Window A: `http://localhost:5173/` (you, Eshaal)
   - Window B: `http://localhost:5173/?as=atika` (Atika)
3. In each, click **Continue with Google** (signs in as Eshaal).
4. Use 100% or 110% browser zoom so text is readable on a projector.
5. In each document, open **Demo → Reset document** once so it starts clean.

## Testing with real people (two tabs, guests, another browser)

Each browser tab has its own sign-in, so every tab can be a different person.

| To test | Do this |
| --- | --- |
| Two people in one browser | Tab 1: **Continue with Google** (Eshaal). Tab 2: **Continue as guest** (e.g. "Anonymous Otter"), or sign in with any other email (e.g. `sara@test.com` becomes "Sara"). Open the same document in both. |
| Someone joining | Watch tab 1 when tab 2 opens the document: their avatar appears in the top bar (your own is at the far right), and their cursor and selections appear in the text. |
| Another browser or a private window | In tab 1, **Share → Copy link** (or the arrow next to Share → Copy link). Paste the link in a private/incognito window or another browser, sign in as a guest, and you land in the same live document. |
| Edits syncing | Type in either window; it appears in the other within a moment. |

The sync server must be running (`npm run dev`). A link copied from the address bar won't work in another browser; use **Copy link**, which includes the document's address.

## The story in five beats

| Beat | Show | Say |
| --- | --- | --- |
| 1. Familiar editor | Home, open *Market Demand Analysis*, type a sentence | "It works like any shared document." |
| 2. Real-time sync | Type in window A, watch window B update; move the cursor to show presence | "Edits sync instantly through CRDTs (Automerge)." |
| 3. The problem | **Demo → Atika and Ibrahim join**, then **Both online** | "Two people change the same sentence at once. The CRDT merges both edits correctly as text: *stable and level* becomes *skyrocketing and plummeting*. No error, but the meaning is now contradictory." |
| 4. SemSync's answer | Click the underlined sentence | "SemSync compares the two concurrent versions and flags a contradiction. It shows the sentence before, what each person changed, and the merged result. Nothing is rewritten automatically." |
| 5. Resolution | Click **Keep** on one version; show it in window B | "The choice is a normal edit, so it syncs to everyone and can be undone." |

Then, if time allows:

- **Offline:** **Demo → Reset document**, then **You offline, then reconnect**. Point at the **Offline** pill in the top bar while your edit stays on screen, then at **Synced** when Ibrahim's waiting edit merges in and is flagged.
- **Grammatical conflict:** open *The Quick Brown Fox*, run **Both online**. Both people add "quick" to "The brown fox." at the same time, so the merge reads "The quick quick brown fox." SemSync underlines "quick quick" in purple and lists it under **Grammar** in the Review panel; hover it and choose **Apply** to get "The quick brown fox."
- **Both resolve at once:** after a scenario, run **Atika resolves it at the same time**. You and Atika resolve the same issue from the same version. Both resolutions are stored in the shared Automerge document; the latest one wins (user id breaks a tie), the text is repaired once so nothing is duplicated, and a notice says whose choice was kept.
- **Grammar fixed during the merge:** in *Market Demand Analysis*, run **Merge causes a grammar error**. One person deletes "early", the other changes "increase" to "rise"; the merge would read "an rise", so SemSync fixes it to "a rise" in the same step and lists it under **Resolved** in the Review panel.
- **Grammar:** point at the dotted underline on "figures shows" / "tests shows", click it, **Apply**.
- **Resilience:** tick **Semantic analysis unavailable**, rerun a scenario. Editing still works; the Review panel explains analysis is unavailable.

## Recording backup clips (Windows 11)

Record short clips, one per beat, so a failed live demo never stalls the talk.

**Easiest: Snipping Tool**

1. Press `Win + Shift + R` (or open Snipping Tool → video camera icon).
2. Drag a rectangle around the browser window(s), click **Start**.
3. Perform the beat, click **Stop**, then **Save** (MP4).

**More control: OBS Studio** (free, obsproject.com)

1. Add a **Window Capture** source for the browser.
2. Settings → Output → Recording format **MP4**; Video → 1920×1080, 30 fps.
3. Click **Start Recording**, perform the beat, **Stop Recording**.

**Inside PowerPoint**: Insert → Screen Recording records straight into a slide. Handy, but harder to re-take than a separate MP4.

Tips:

- Close other tabs, notifications and the Demo menu before recording; hide bookmarks.
- Move the mouse slowly and pause one second after each important change.
- Keep each clip 20 to 45 seconds. Record without audio and narrate live.
- Reset the document between takes.

## Should the clips go in the slides?

Yes, as a backup, not a replacement for the live demo.

- Do the demo **live** first. It's more convincing, and examiners can ask you to try something.
- Put each clip on its own slide right after the slide that explains that beat (problem, detection, resolution, offline). If the live demo fails, play the clip and keep going.
- Insert → Video → This Device, choose the MP4. Under **Playback**, set *Start: On Click*, untick *Loop*, and use *Trim Video* to cut dead time.
- Keep the clips in the same folder as the `.pptx` and test on the presentation laptop, because embedded video makes files large.
- Pair every clip with one sentence on the slide saying what to notice, for example: "Both edits merge as text, but the meaning contradicts."
