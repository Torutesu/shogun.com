# SHOGUN — SEO Article Pipeline

Target: AI-native individuals searching for productivity tools, AI workflows, cloud computing.
Primary language: EN. Secondary: JA (Note.com, Qiita).

---

## Content Pillars

| Pillar | SEO Theme | Target Keywords |
|--------|-----------|----------------|
| 1. AI Memory | Why AI forgets + how to fix it | ai memory, ai context, persistent ai |
| 2. Cloud Computer | Personal server for AI work | ai cloud computer, personal cloud server |
| 3. Multi-Model | Using multiple AI models together | multi model ai, claude vs gpt, ai router |
| 4. Use Cases | Specific workflow improvements | ai for freelancers, ai for founders, ai productivity |
| 5. Technical | How we built it | pgvector tutorial, fly.io machines, ai tool use |

---

## Article Pipeline (Priority Order)

### Tier 1: Launch Articles (Publish Week 1-2)

#### 1. "Why Every AI Session Starts From Zero (And How to Fix It)"
- **Target KW**: ai context loss, ai memory, chatgpt no memory
- **Search intent**: Problem-aware users frustrated with AI
- **Angle**: Problem article. Name the pain. Introduce memory as the solution.
- **Outline**:
  1. The daily ritual: copy-paste context into every AI chat
  2. Why AI architectures are stateless by design
  3. The real cost: 15+ hours/month on context re-entry
  4. What "AI memory" actually means (not chat history)
  5. Semantic search over work history: the missing layer
  6. How SHOGUN solves this (brief product intro)
- **Word count**: 1,500-2,000
- **CTA**: Free trial
- **Distribution**: Blog, Hacker News, Reddit r/Productivity

#### 2. "SHOGUN vs ChatGPT vs Cursor: What Category Are We In?"
- **Target KW**: chatgpt alternative, cursor alternative, ai cloud computer
- **Search intent**: Comparison shoppers evaluating AI tools
- **Angle**: Category creation. Position SHOGUN in its own space.
- **Outline**:
  1. The AI tool landscape in 2026
  2. Chat-only tools (ChatGPT, Claude.ai): great models, no compute
  3. Code-only tools (Cursor, Windsurf): great for code, only code
  4. Cloud sandboxes (Zo): compute but no memory
  5. SHOGUN: cloud computer + work memory + any model
  6. Feature comparison table
  7. Who should use what
- **Word count**: 2,000-2,500
- **CTA**: See the difference — try SHOGUN free
- **Distribution**: Blog, LinkedIn, Reddit r/SideProject

#### 3. "What Is a Personal AI Cloud Computer?"
- **Target KW**: personal cloud computer, ai cloud server, remote dev environment
- **Search intent**: Curious searchers exploring new AI categories
- **Angle**: Educational. Define the category.
- **Outline**:
  1. Beyond chatbots: AI that can execute
  2. What you get: a real Linux machine (CPU, RAM, storage)
  3. Why per-user isolation matters (security, persistence)
  4. Use cases: deploy, automate, develop, all from AI chat
  5. How Fly.io Machines make it possible
  6. SHOGUN's implementation
- **Word count**: 1,500
- **CTA**: Get your own cloud computer
- **Distribution**: Blog, Dev.to

---

### Tier 2: Depth Articles (Publish Week 3-6)

#### 4. "Building Semantic Search Over Your Work History with pgvector"
- **Target KW**: pgvector tutorial, semantic search postgres, ai memory architecture
- **Search intent**: Developers interested in vector search / RAG
- **Angle**: Technical deep dive. Show the architecture.
- **Outline**:
  1. Why vector search > keyword search for work context
  2. Text embeddings: text-embedding-3-small (1536 dims)
  3. pgvector setup and indexing strategies
  4. Chunking work context (OCR output, transcriptions, terminal)
  5. Query patterns: similarity search with metadata filtering
  6. Performance at scale: HNSW indexes
  7. How SHOGUN uses this in production
- **Word count**: 2,500-3,000
- **CTA**: See it in action
- **Distribution**: Blog, Hacker News, Dev.to, Qiita (JA)

#### 5. "Multi-Model AI Routing: Claude + GPT + Gemini in One Interface"
- **Target KW**: multi model ai, ai model router, claude vs gpt vs gemini
- **Search intent**: Users wanting to compare/use multiple AI models
- **Angle**: Technical + practical. Why and how to use multiple models.
- **Outline**:
  1. No single model is best at everything
  2. Model strengths: Claude (reasoning), GPT-4o (code), Gemini (multimodal)
  3. BYOK: bring your own keys, control costs
  4. Tool Use across models: standardizing function calls
  5. Switching mid-conversation with shared context
  6. Cost optimization: right model for the right task
- **Word count**: 2,000
- **CTA**: Try all three models free
- **Distribution**: Blog, Twitter thread, LinkedIn

#### 6. "SHOGUN for Freelancers: Managing Multiple Client Projects with AI"
- **Target KW**: ai for freelancers, freelancer productivity tools, project management ai
- **Search intent**: Freelancers looking for better workflows
- **Angle**: Use case story. Day-in-the-life format.
- **Outline**:
  1. The freelancer context-switching problem
  2. Client A (React), Client B (Rails), Client C (Python)
  3. How SHOGUN memory isolates and recalls per-project context
  4. Using cloud compute for each client's stack
  5. Time saved: real numbers from early users
  6. Pricing for freelancers ($49/mo vs. time saved)
- **Word count**: 1,500
- **CTA**: Start free trial
- **Distribution**: Blog, Reddit r/freelance, Twitter

#### 7. "How We Built Per-User Linux Machines with Fly.io"
- **Target KW**: fly.io machines, per user containers, cloud infrastructure
- **Search intent**: Developers/founders building similar infra
- **Angle**: Technical behind-the-scenes. Build-in-public credibility.
- **Outline**:
  1. The requirement: 1 user = 1 dedicated Linux machine
  2. Why Fly.io Machines (vs. EC2, vs. Kubernetes)
  3. Machine lifecycle: provision, start, stop, auto-sleep
  4. Container agent sidecar (Go): PTY, file ops, health checks
  5. Networking: private mesh + user subdomains
  6. Cost model and scaling
- **Word count**: 2,500
- **CTA**: See the result — try SHOGUN
- **Distribution**: Blog, Hacker News, Fly.io community

---

### Tier 3: Long-Tail SEO (Publish Week 7-12)

#### 8. "AI That Remembers Your Meetings: Auto-Transcription + Semantic Search"
- **Target KW**: ai meeting notes, meeting transcription search, ai meeting memory
- **Word count**: 1,500
- **Angle**: PM/manager use case for meeting memory

#### 9. "Stop Paying for AI Tokens You Don't Control: The BYOK Model"
- **Target KW**: byok ai, bring your own api key, ai cost control
- **Word count**: 1,200
- **Angle**: Cost transparency, user control

#### 10. "Screen OCR for Work Context: How We Capture Without Screenshots"
- **Target KW**: screen ocr, work context capture, privacy ai
- **Word count**: 2,000
- **Angle**: Technical + privacy-focused

#### 11. "Why Your AI Needs a Real Computer, Not a Sandbox"
- **Target KW**: ai sandbox vs server, ai code execution, persistent compute
- **Word count**: 1,500
- **Angle**: Comparison: sandboxes vs. real machines

#### 12. "The Solo Founder's AI Stack in 2026"
- **Target KW**: solo founder tools, ai tools for startups, startup ai stack
- **Word count**: 2,000
- **Angle**: SHOGUN as the centerpiece of an AI-native workflow

---

## JA Articles (Note.com / Qiita)

| # | Title | Platform | Target |
|---|-------|----------|--------|
| J1 | SHOGUNを作った理由 — AIに毎回同じことを説明するのをやめたかった | Note.com | General tech audience |
| J2 | pgvectorで作るワークメモリ：セマンティック検索の実装ガイド | Qiita | Developers |
| J3 | Fly.io Machinesでユーザーごとの専用Linuxマシンを構築する | Qiita | Developers |
| J4 | フリーランスのためのAI活用術 — SHOGUN で複数案件を一元管理 | Note.com | Freelancers |
| J5 | 2026年、ソロファウンダーのAIスタック完全版 | Note.com | Founders |

---

## Publishing Cadence

| Week | Article | Platform |
|------|---------|----------|
| W1 | #1 Why Every AI Session Starts From Zero | Blog + HN + Reddit |
| W2 | #2 SHOGUN vs ChatGPT vs Cursor | Blog + LinkedIn |
| W2 | J1 SHOGUNを作った理由 | Note.com |
| W3 | #3 What Is a Personal AI Cloud Computer | Blog + Dev.to |
| W4 | #4 pgvector Semantic Search | Blog + HN + Qiita (J2) |
| W5 | #5 Multi-Model AI Routing | Blog + Twitter |
| W6 | #6 SHOGUN for Freelancers | Blog + Reddit |
| W7 | #7 Fly.io Per-User Machines | Blog + HN + Qiita (J3) |
| W8 | #8 AI Meeting Memory | Blog |
| W9 | #9 BYOK Model | Blog + Twitter |
| W10 | #10 Screen OCR | Blog + Dev.to |
| W10 | J4 フリーランスのためのAI活用術 | Note.com |
| W11 | #11 Real Computer vs Sandbox | Blog |
| W12 | #12 Solo Founder AI Stack | Blog + Note.com (J5) |

---

## SEO Technical Checklist

- [ ] Blog at syogun.com/blog (Next.js App Router pages)
- [ ] Structured data (Article schema) on all posts
- [ ] OG images auto-generated per article
- [ ] Sitemap.xml includes blog pages
- [ ] Internal linking: every article links to 2+ other articles
- [ ] CTA component at bottom of every article
- [ ] Email capture (waitlist) in blog sidebar
- [ ] Analytics: track article -> signup conversion

---

*Select KK, Tokyo. 2026.*
