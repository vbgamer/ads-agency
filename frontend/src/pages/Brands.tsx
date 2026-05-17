import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Search, BadgeCheck, ArrowRight, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  cover_url: string | null;
  category: string | null;
  bio: string | null;
  is_verified: boolean | null;
}

export default function Brands() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { profile } = useAuth();
  const isPremium = profile?.is_premium;

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url, cover_url, category, bio, is_verified')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Company[];
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  // Get unique categories from companies
  const categories = useMemo(() => {
    if (!companies) return [];
    const categoryMap = new Map<string, number>();
    companies.forEach((company) => {
      if (company.category) {
        categoryMap.set(company.category, (categoryMap.get(company.category) || 0) + 1);
      }
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [companies]);

  // Filter companies based on search and category
  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter((company) => {
      const matchesSearch = searchQuery === "" ||
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.category && company.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || company.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [companies, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8 skeleton-shimmer skeleton-shimmer-primary">
          <div className="skeleton-accent-bar skeleton-accent-bar-primary mb-6" />
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <Skeleton className="h-10 w-full max-w-md mb-6" />
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="relative h-32 w-full bg-muted overflow-hidden">
                  <div className="absolute inset-0 skeleton-shimmer skeleton-shimmer-primary" />
                </div>
                <CardContent className="pt-12 pb-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Brands</h1>
            </div>
            <p className="text-muted-foreground">
              Discover companies and explore their offers
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className={cn(
              "relative max-w-md",
              isPremium && "premium-input-wrapper"
            )}>
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                isPremium ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
              )} />
              <Input
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10",
                  isPremium && "border-yellow-500/30 focus:border-yellow-500/50"
                )}
              />
            </div>
          </motion.div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 mb-8"
            >
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All ({companies?.length || 0})
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </motion.div>
          )}

          {/* Companies Grid */}
          {filteredCompanies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Building2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No brands found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search or filters"
                  : "No companies have registered yet"}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link to={`/company/${company.id}`}>
                    <Card className={cn(
                      "overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer h-full",
                      isPremium && "premium-card-highlight"
                    )}>
                      {/* Cover Image */}
                      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20">
                        {company.cover_url && (
                          <img
                            src={company.cover_url}
                            alt={`${company.name} cover`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        {/* Logo */}
                        <div className="absolute -bottom-8 left-4">
                          <div className="h-16 w-16 rounded-xl bg-card border-4 border-background shadow-lg overflow-hidden flex items-center justify-center">
                            {company.logo_url ? (
                              <img
                                src={company.logo_url}
                                alt={company.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random&size=64`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="pt-12 pb-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {company.name}
                          </h3>
                          {company.is_verified && (
                            <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>

                        {company.category && (
                          <Badge variant="secondary" className="mb-3">
                            {company.category}
                          </Badge>
                        )}

                        {company.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {company.bio}
                          </p>
                        )}

                        <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                          View Profile
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </MainLayout>
  );
}
