"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

export function CategorySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      router.push("/categories");
    } else {
      router.push(`/categories?${createQueryString("q", debouncedQuery)}`);
    }
  }, [debouncedQuery, router, createQueryString]);

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search categories..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-8"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-7 w-7 px-0"
          onClick={() => setQuery("")}
        >
          <span className="sr-only">Clear search</span>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 