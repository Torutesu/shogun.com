# SHOGUN — Product Hunt Launch Assets

---

## Tagline Candidates (60 chars max)

| # | Tagline | Chars | Notes |
|---|---------|-------|-------|
| 1 | **The only AI that knows your work** | 36 | Primary. Clear differentiator. |
| 2 | Your AI cloud computer with work memory | 41 | Descriptive. Explains what it is. |
| 3 | AI that remembers everything you've worked on | 47 | Memory-forward. |
| 4 | Stop explaining yourself to AI | 31 | Pain-point driven. Provocative. |
| 5 | One AI. Every model. Full memory. | 33 | Concise trifecta. |

**Recommendation**: #1 for primary. #4 for social/ads.

---

## Description (260 chars max)

> SHOGUN gives every user a personal AI cloud computer with persistent work memory. Your desktop captures context, AI remembers everything, and your own Linux machine executes. Claude, GPT, Gemini — one place. Never start from zero again.

(237 chars)

---

## Demo GIF Storyboard (30 seconds, 1200x800, dark theme)

### GIF 1: "Memory Search" (Hero GIF — main gallery position)

```
[0-3s]  SHOGUN dashboard. Dark UI. Chat panel open.
        Cursor blinks in input field.

[3-8s]  User types: "What did I decide about the auth
        architecture last month?"

[8-12s] Loading indicator. Gold pulse animation.
        "Searching work memory..." text appears.

[12-18s] AI response streams in:
         "Based on your work from March 12, you decided to
         switch from JWT sessions to Supabase Auth with
         RLS. The key reasons were..."
         Memory context panel slides in from right showing
         3 memory entries with timestamps and source labels.

[18-22s] User scrolls memory panel. Entries show:
         - [Mar 12 — Terminal] supabase auth setup commands
         - [Mar 12 — Meeting] "Auth discussion with team"
         - [Mar 11 — Screen] Architecture diagram review

[22-26s] Quick cut to terminal tab. User's cloud machine.
         `ls` shows project files. Real persistent server.

[26-30s] Fade to SHOGUN logo + tagline:
         "The only AI that knows your work"
         syogun.com
```

### GIF 2: "Cloud Computer" (Gallery position 2)

```
[0-3s]  Split view: Terminal left, File browser right.

[3-8s]  In chat: "Deploy my Next.js app on my server."

[8-15s] Terminal shows commands executing:
        $ cd ~/projects/my-app
        $ npm run build
        $ npm start
        Server running on port 3000

[15-20s] File browser updates showing build output.
         Status indicator: Machine ON (green dot).

[20-25s] Browser preview opens showing deployed app.

[25-30s] Fade to: "Your server. Your files. Always on."
         syogun.com
```

### GIF 3: "Multi-Model" (Gallery position 3)

```
[0-3s]  Chat interface. Model selector shows "Claude Sonnet 4".

[3-8s]  User asks a reasoning question. Claude responds.

[8-12s] User clicks model selector dropdown.
        Options: Claude Sonnet 4, Claude Opus 4, GPT-4o,
        GPT-4o Mini, Gemini 2.0 Flash, Gemini 2.5 Pro

[12-16s] Selects "GPT-4o". Badge updates.

[16-22s] Continues same conversation. GPT-4o responds
         with full context from previous messages.

[22-26s] Memory panel shows: context preserved across models.

[26-30s] Fade to: "Every model. One memory."
         syogun.com
```

---

## Gallery Images (5 images, 1270x760px)

| # | Image | Description |
|---|-------|-------------|
| 1 | **Chat + Memory** | Chat interface with AI response referencing past work. Memory context panel visible on right. Dark theme, gold accents. |
| 2 | **Terminal + Files** | Split view of xterm.js terminal and file browser. Shows user's persistent cloud machine with real project files. |
| 3 | **Memory Feed** | Timeline of captured work context. Entries tagged with source (Screen, Meeting, Terminal). Search bar with results highlighted. |
| 4 | **Model Selector** | Dropdown showing Claude, GPT-4o, Gemini options. Active model highlighted with gold badge. Token usage visible. |
| 5 | **Landing Page** | syogun.com hero section. Dark background, Bebas Neue "SHOGUN" with gold G, kanji watermark. Premium feel. |

---

## Maker Comment (Final Version)

See `docs/PRODUCT_HUNT.md` for full EN/JA maker comments. Key updates for launch:

**Opening hook** (first 2 lines visible before "Read more"):
> Hey PH! We built SHOGUN because every AI conversation starts from zero — and we were done with that. Here's what we made.

**Key metrics to add on launch day**:
- Time saved per user (from beta data)
- Number of memory entries processed
- Models supported: 6 (Claude Sonnet/Opus, GPT-4o/Mini, Gemini Flash/Pro)

---

## Launch Day Checklist

### Pre-launch (Day before)
- [ ] Upload all 5 gallery images
- [ ] Upload hero GIF
- [ ] Set tagline: "The only AI that knows your work"
- [ ] Set description (237 chars)
- [ ] Paste maker comment
- [ ] Select topics: AI, Productivity, Developer Tools
- [ ] Schedule for 00:01 PST Tuesday
- [ ] Confirm Hunter is ready
- [ ] Pre-write X thread (see x-posts-30days.md Day 8-9)
- [ ] Pre-write HN post for next day

### Launch morning (00:01 PST)
- [ ] Verify PH listing is live
- [ ] Post X launch thread
- [ ] Share in relevant Slack/Discord communities
- [ ] Post to LinkedIn
- [ ] Email waitlist: "We're live on Product Hunt"
- [ ] Monitor comments, respond within 15 min

### Launch day ongoing
- [ ] Reply to every PH comment
- [ ] Retweet/engage with mentions
- [ ] Post behind-the-scenes updates on X
- [ ] Evening: thank you post with metrics

### Day after
- [ ] Post on Hacker News (Show HN)
- [ ] Publish blog article #1
- [ ] Send follow-up email to waitlist with PH results

---

## Recording the GIFs

### Tools
- **Screen recording**: OBS Studio or macOS screen recording
- **GIF conversion**: `ffmpeg -i input.mov -vf "fps=15,scale=1200:-1" -loop 0 output.gif`
- **Optimization**: `gifsicle -O3 --lossy=80 output.gif -o optimized.gif`
- **Target size**: Under 5MB per GIF (PH limit)

### Setup
- Use SHOGUN dashboard in dark mode
- Browser: Chrome, clean profile, no extensions visible
- Resolution: 2x retina, crop to 1200x800 logical pixels
- Pre-populate realistic data (work memory entries, files, conversations)
- Use real project names and realistic queries

---

*Select KK, Tokyo. 2026.*
