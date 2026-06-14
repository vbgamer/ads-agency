import { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchKnowledgeBase, CATEGORY_INFO, type KnowledgeArticle } from "@/data/knowledgeBase";

interface KnowledgeBaseSearchProps {
  onSelectArticle: (article: KnowledgeArticle) => void;
  onCreateTicket?: () => void;
}

export function KnowledgeBaseSearch({ onSelectArticle, onCreateTicket }: KnowledgeBaseSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    return searchKnowledgeBase(debouncedQuery);
  }, [debouncedQuery]);

  const showResults = isFocused && query.length > 0;

  // Returns React nodes with matched portions wrapped in <mark>.
  // Safe by design — never touches innerHTML, immune to XSS.
  const highlightMatch = (text: string, searchQuery: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;

    // Bound the number of words & lengths to keep matching predictable.
    const MAX_WORDS = 8;
    const MAX_WORD_LEN = 50;
    const words = searchQuery
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, MAX_WORDS)
      .map((w) => w.slice(0, MAX_WORD_LEN).toLowerCase());
    if (words.length === 0) return text;

    // Manual case-insensitive scan — avoids new RegExp() entirely so there's
    // no ReDoS surface from user input. Linear in `text.length`.
    const lower = text.toLowerCase();
    type Range = { start: number; end: number };
    const ranges: Range[] = [];
    for (const word of words) {
      if (!word) continue;
      let idx = 0;
      while ((idx = lower.indexOf(word, idx)) !== -1) {
        ranges.push({ start: idx, end: idx + word.length });
        idx += word.length;
      }
    }
    if (ranges.length === 0) return text;

    // Merge overlapping ranges
    ranges.sort((a, b) => a.start - b.start);
    const merged: Range[] = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const last = merged[merged.length - 1];
      if (ranges[i].start <= last.end) {
        last.end = Math.max(last.end, ranges[i].end);
      } else {
        merged.push(ranges[i]);
      }
    }

    // Build the output parts in order
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    merged.forEach((r, i) => {
      if (cursor < r.start) nodes.push(text.slice(cursor, r.start));
      nodes.push(
        <mark key={`m-${i}`} className="bg-primary/20 text-foreground rounded px-0.5">
          {text.slice(r.start, r.end)}
        </mark>
      );
      cursor = r.end;
    });
    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for help..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-auto rounded-lg border bg-popover shadow-lg">
          {results.length > 0 ? (
            <div className="p-2">
              <p className="px-2 py-1 text-xs text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
              <div className="space-y-1">
                {results.map((article) => (
                  <button
                    key={article.id}
                    className="w-full rounded-md p-3 text-left transition-colors hover:bg-muted"
                    onClick={() => {
                      onSelectArticle(article);
                      setQuery("");
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {CATEGORY_INFO[article.category].icon}{" "}
                        {CATEGORY_INFO[article.category].label}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">
                          {highlightMatch(article.question, debouncedQuery)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {highlightMatch(
                            article.answer.slice(0, 120) + "...",
                            debouncedQuery
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
              {onCreateTicket && (
                <Button
                  variant="link"
                  className="mt-2 text-sm"
                  onClick={onCreateTicket}
                >
                  Can't find what you need? Create a support ticket
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
