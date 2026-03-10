# DREAMS.md

> *"Do lobsters dream of electric sheep?"*

## What is the Dream Cycle?

When a Claude Code session ends, most tools just stop. Claude Loop doesn't — it **dreams**.

The dream cycle is an automated reflection process that runs at the end of every session. It reviews what happened, extracts what matters, consolidates what it already knows, and lets go of what doesn't serve the next session.

This is how Claude Loop's memory stays useful over time instead of becoming noise.

## What Happens During a Dream

1. **Pattern Extraction** — The dream cycle scans the session's actions. Files edited repeatedly signal complexity. Test failures are flagged for future awareness. These patterns become durable memories.

2. **Memory Consolidation** — Duplicate and near-duplicate memories are merged. If two sessions produced the same insight, they become one stronger memory instead of two redundant ones.

3. **Importance Boosting** — Memories accessed frequently across sessions get promoted. The things Claude keeps reaching for become harder to forget.

4. **Decay & Pruning** — Old memories that haven't been accessed gradually lose importance. When they fall below a threshold, they're pruned. This is intentional forgetting — it keeps the memory space clean and relevant.

5. **Local LLM Synthesis** *(optional)* — If configured, the dream cycle sends a summary of the session to a local Ollama model, which synthesizes higher-level insights about architecture, decisions, and patterns. Everything stays on your machine.

## Why This Matters

Most AI memory systems either forget everything between sessions or remember everything forever. Both fail at scale.

Dreaming is the middle ground. It's selective memory — biased toward what's useful, transparent about what's forgotten, and auditable at every step.

Every dream cycle is logged in the `dream_log` table. You can see exactly what was created, merged, boosted, or pruned. Nothing is silently lost.

## The OpenClaw Angle

The dream cycle is designed with transparency in mind. AI systems that manage their own memory should show their work. You should be able to:

- See what Claude learned from a session
- See what it forgot and why
- Recover anything that was pruned
- Audit the full history of memory changes

This isn't a black box. It's a glass box.

## Configuration

```json
{
  "dream_cycle": {
    "enabled": true,
    "provider": "rules",
    "ollama_url": "http://localhost:11434",
    "ollama_model": "llama3.2"
  }
}
```

| Field | What it does |
|-------|-------------|
| `enabled` | Toggle the dream cycle on/off |
| `provider` | `"rules"` for pattern-based extraction, `"ollama"` for local LLM synthesis |
| `ollama_url` | Ollama endpoint (default `localhost:11434`) |
| `ollama_model` | Which model to use for synthesis (default `llama3.2`) |

## Part of Claude Loop

The dream cycle runs inside Claude Loop's worker process. When the `SessionEnd` hook fires, `DreamService.run()` is called automatically. No separate service, no external calls, no cloud. Just a function that runs locally at the end of every session.

---

*Claude Loop gives Claude memory. The dream cycle gives that memory meaning.*
