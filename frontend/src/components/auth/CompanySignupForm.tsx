import * as React from "react";
import { ArrowRight, Building2, Upload, Search, Check, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; icon?: string };

type Props = {
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;

  categories: Category[];

  // Logo
  logoPreview: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Banner
  bannerPreview: string | null;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Fields
  companyNameRef?: React.Ref<HTMLInputElement>;
  companyName: string;
  setCompanyName: (v: string) => void;

  companyCategory: string;
  setCompanyCategory: (v: string) => void;

  companyEmail: string;
  setCompanyEmail: (v: string) => void;

  companyPassword: string;
  setCompanyPassword: (v: string) => void;

  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
};

export function CompanySignupForm({
  onSubmit,
  isLoading,
  categories,
  logoPreview,
  onLogoUpload,
  bannerPreview,
  onBannerUpload,
  companyNameRef,
  companyName,
  setCompanyName,
  companyCategory,
  setCompanyCategory,
  companyEmail,
  setCompanyEmail,
  companyPassword,
  setCompanyPassword,
  confirmPassword,
  setConfirmPassword,
}: Props) {
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [categorySearch, setCategorySearch] = React.useState("");

  const filteredCategories = React.useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const selectedCategory = categories.find((cat) => cat.id === companyCategory);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Company Logo Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Company Logo <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/50">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Company logo preview"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="logo-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                <Upload className="h-4 w-4" />
                Upload Logo
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onLogoUpload}
              />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
          </div>
        </div>
      </div>

      {/* Company Banner Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Profile Banner <span className="text-destructive">*</span>
        </label>
        <div className="relative w-full h-32 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/50">
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt="Company banner preview"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center flex-col gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">1200 x 300 recommended</span>
            </div>
          )}
        </div>
        <label htmlFor="banner-upload" className="cursor-pointer">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted w-fit">
            <Upload className="h-4 w-4" />
            Upload Banner
          </div>
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onBannerUpload}
          />
        </label>
        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB. Recommended size: 1200x300px</p>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Company Name <span className="text-destructive">*</span>
        </label>
        <Input
          ref={companyNameRef}
          type="text"
          placeholder="Enter your company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          autoComplete="organization"
        />
      </div>

      {/* Company Category with Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Company Category <span className="text-destructive">*</span>
        </label>
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={categoryOpen}
              className="w-full justify-between font-normal"
            >
              {selectedCategory ? (
                <span className="flex items-center gap-2">
                  {selectedCategory.icon && <span>{selectedCategory.icon}</span>}
                  {selectedCategory.name}
                </span>
              ) : (
                <span className="text-muted-foreground">Select a category</span>
              )}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <div className="flex items-center border-b border-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredCategories.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No category found.
                </div>
              ) : (
                filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                      companyCategory === cat.id && "bg-accent"
                    )}
                    onClick={() => {
                      setCompanyCategory(cat.id);
                      setCategoryOpen(false);
                      setCategorySearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        companyCategory === cat.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Email Address <span className="text-destructive">*</span>
        </label>
        <Input
          type="email"
          placeholder="company@example.com"
          value={companyEmail}
          onChange={(e) => setCompanyEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Password <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          placeholder="Create a strong password"
          value={companyPassword}
          onChange={(e) => setCompanyPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Confirm Password <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Company Account"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <a href="#" className="text-primary hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-primary hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
