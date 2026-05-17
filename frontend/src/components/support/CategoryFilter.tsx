import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  CATEGORY_INFO,
  getCategoryCounts,
  type KnowledgeCategory,
} from "@/data/knowledgeBase";

interface CategoryFilterProps {
  selectedCategory: KnowledgeCategory | null;
  onSelectCategory: (category: KnowledgeCategory | null) => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const counts = getCategoryCounts();
  const categories = Object.keys(CATEGORY_INFO) as KnowledgeCategory[];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Browse by Category</p>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer shrink-0 px-3 py-1.5 text-sm transition-colors hover:bg-primary/90"
            onClick={() => onSelectCategory(null)}
          >
            All
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer shrink-0 px-3 py-1.5 text-sm transition-colors hover:bg-primary/90"
              onClick={() =>
                onSelectCategory(selectedCategory === category ? null : category)
              }
            >
              {CATEGORY_INFO[category].icon} {CATEGORY_INFO[category].label}
              <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">
                {counts[category]}
              </span>
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
