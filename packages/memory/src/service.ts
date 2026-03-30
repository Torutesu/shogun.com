import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemorySource } from "@shogun/shared";

export interface CaptureInput {
  userId: string;
  source: MemorySource;
  content: string;
  appName?: string;
  capturedAt?: string;
}

export interface SearchInput {
  userId: string;
  query: string;
  limit?: number;
  source?: MemorySource;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchResult {
  id: string;
  content: string;
  summary: string | null;
  source: MemorySource;
  appName: string | null;
  capturedAt: string;
  similarity: number;
}

interface MemoryServiceDeps {
  supabase: SupabaseClient;
  generateEmbedding: (text: string) => Promise<number[]>;
  generateSummary: (text: string) => Promise<string>;
}

export class MemoryService {
  private deps: MemoryServiceDeps;

  constructor(deps: MemoryServiceDeps) {
    this.deps = deps;
  }

  async capture(input: CaptureInput): Promise<string> {
    const { supabase, generateEmbedding, generateSummary } = this.deps;

    // Check if app is excluded
    if (input.appName) {
      const { data: exclusion } = await supabase
        .from("memory_exclusions")
        .select("id")
        .eq("user_id", input.userId)
        .eq("app_name", input.appName)
        .single();

      if (exclusion) {
        throw new Error(`App "${input.appName}" is excluded from capture`);
      }
    }

    // Generate embedding
    const embedding = await generateEmbedding(input.content);

    // Store entry
    const { data, error } = await supabase
      .from("memory_entries")
      .insert({
        user_id: input.userId,
        source: input.source,
        content: input.content,
        embedding,
        app_name: input.appName,
        captured_at: input.capturedAt ?? new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    // Generate summary async (don't block)
    generateSummary(input.content).then(async (summary) => {
      await supabase
        .from("memory_entries")
        .update({ summary })
        .eq("id", data.id);
    });

    return data.id;
  }

  async search(input: SearchInput): Promise<SearchResult[]> {
    const { supabase, generateEmbedding } = this.deps;

    const queryEmbedding = await generateEmbedding(input.query);

    const { data, error } = await supabase.rpc("search_memory", {
      p_user_id: input.userId,
      p_query_embedding: queryEmbedding,
      p_limit: input.limit ?? 20,
      p_threshold: 0.7,
    });

    if (error) throw error;

    let results = (data ?? []) as SearchResult[];

    // Apply filters
    if (input.source) {
      results = results.filter((r) => r.source === input.source);
    }
    if (input.dateFrom) {
      results = results.filter((r) => r.capturedAt >= input.dateFrom!);
    }
    if (input.dateTo) {
      results = results.filter((r) => r.capturedAt <= input.dateTo!);
    }

    return results;
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    const { error } = await this.deps.supabase
      .from("memory_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) throw error;
  }
}
