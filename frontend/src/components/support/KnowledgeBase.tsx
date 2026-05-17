import { useState, useMemo } from "react";
import { ThumbsUp, ThumbsDown, ChevronRight, HelpCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { KnowledgeBaseSearch } from "./KnowledgeBaseSearch";
import { CategoryFilter } from "./CategoryFilter";
import {
  knowledgeBase,
  getPopularArticles,
  getArticlesByCategory,
  getRelatedArticles,
  CATEGORY_INFO,
  type KnowledgeArticle,
  type KnowledgeCategory,
} from "@/data/knowledgeBase";

interface KnowledgeBaseProps {
  onCreateTicket: () => void;
  onCreateDispute: () => void;
}

export function KnowledgeBase({ onCreateTicket, onCreateDispute }: KnowledgeBaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [helpfulArticles, setHelpfulArticles] = useState<Set<string>>(new Set());
  const [notHelpfulArticles, setNotHelpfulArticles] = useState<Set<string>>(new Set());

  const displayedArticles = useMemo(() => {
    if (selectedCategory) {
      return getArticlesByCategory(selectedCategory);
    }
    return getPopularArticles();
  }, [selectedCategory]);

  const handleSelectArticle = (article: KnowledgeArticle) => {
    setSelectedCategory(article.category);
    setExpandedArticle(article.id);
  };

  const handleHelpful = (articleId: string, isHelpful: boolean) => {
    if (isHelpful) {
      setHelpfulArticles((prev) => new Set(prev).add(articleId));
      setNotHelpfulArticles((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
      toast.success("Thanks for your feedback!");
    } else {
      setNotHelpfulArticles((prev) => new Set(prev).add(articleId));
      setHelpfulArticles((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
      toast("We're sorry this wasn't helpful. Consider creating a ticket for more help.", {
        action: {
          label: "Create Ticket",
          onClick: onCreateTicket,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <KnowledgeBaseSearch
        onSelectArticle={handleSelectArticle}
        onCreateTicket={onCreateTicket}
      />

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Articles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {selectedCategory
              ? `${CATEGORY_INFO[selectedCategory].icon} ${CATEGORY_INFO[selectedCategory].label}`
              : "Popular Questions"}
          </h3>
          {selectedCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Show Popular
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Accordion
              type="single"
              collapsible
              value={expandedArticle || undefined}
              onValueChange={(value) => setExpandedArticle(value || null)}
            >
              {displayedArticles.map((article, index) => (
                <AccordionItem
                  key={article.id}
                  value={article.id}
                  className={index === displayedArticles.length - 1 ? "border-b-0" : ""}
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-2 text-left">
                      {!selectedCategory && (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {CATEGORY_INFO[article.category].icon}
                        </Badge>
                      )}
                      <span className="text-sm font-medium">{article.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {article.answer}
                      </p>

                      {/* Related Articles */}
                      {article.relatedArticles && article.relatedArticles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Related Articles
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {getRelatedArticles(article.id).map((related) => (
                              <Button
                                key={related.id}
                                variant="outline"
                                size="sm"
                                className="h-auto py-1 text-xs"
                                onClick={() => {
                                  setSelectedCategory(related.category);
                                  setExpandedArticle(related.id);
                                }}
                              >
                                <ChevronRight className="mr-1 h-3 w-3" />
                                {related.question.length > 40
                                  ? related.question.slice(0, 40) + "..."
                                  : related.question}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Helpful buttons */}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Was this helpful?
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant={helpfulArticles.has(article.id) ? "default" : "outline"}
                            size="sm"
                            className="h-8"
                            onClick={() => handleHelpful(article.id, true)}
                          >
                            <ThumbsUp className="mr-1 h-3 w-3" />
                            Yes
                          </Button>
                          <Button
                            variant={notHelpfulArticles.has(article.id) ? "destructive" : "outline"}
                            size="sm"
                            className="h-8"
                            onClick={() => handleHelpful(article.id, false)}
                          >
                            <ThumbsDown className="mr-1 h-3 w-3" />
                            No
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Show all in category */}
        {selectedCategory && displayedArticles.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Showing all {displayedArticles.length} articles in{" "}
            {CATEGORY_INFO[selectedCategory].label}
          </p>
        )}
      </div>

      {/* Still need help CTA */}
      <Separator />
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="font-semibold">Still need help?</h4>
          <p className="text-sm text-muted-foreground">
            Our support team is here to assist you
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onCreateTicket} className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Create Support Ticket
          </Button>
          <Button variant="outline" onClick={onCreateDispute} className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Report Missing Cashback
          </Button>
        </div>
      </div>
    </div>
  );
}
