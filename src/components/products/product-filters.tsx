"use client"

import React, { useState } from "react"
import { Sliders, SortAsc, SortDesc } from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { SortOrder } from "@/services/productService"

// Define margin categories
const MARGIN_CATEGORIES = {
  LOW: { label: "Low Margin", min: 0, max: 15 },
  MEDIUM: { label: "Medium Margin", min: 15, max: 30 },
  HIGH: { label: "High Margin", min: 30, max: 100 }
}

type MarginCategory = keyof typeof MARGIN_CATEGORIES | "ALL"

type ProductFiltersProps = {
  onFilterChange?: (filters: {
    minMargin?: number
    maxMargin?: number
    sortBy?: string
    sortOrder?: SortOrder
  }) => void
}

export default function ProductFilters({ onFilterChange }: ProductFiltersProps) {
  // Filter states
  const [marginRange, setMarginRange] = useState<[number, number]>([0, 100])
  const [marginCategory, setMarginCategory] = useState<MarginCategory>("ALL")
  const [marginSortOrder, setMarginSortOrder] = useState<SortOrder | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  // Update filters based on margin category
  const handleCategoryChange = (value: string) => {
    const category = value as MarginCategory
    setMarginCategory(category)

    if (category === "ALL") {
      setMarginRange([0, 100])
      onFilterChange?.({ minMargin: undefined, maxMargin: undefined })
    } else {
      const { min, max } = MARGIN_CATEGORIES[category as keyof typeof MARGIN_CATEGORIES]
      setMarginRange([min, max])
      onFilterChange?.({ minMargin: min, maxMargin: max })
    }
  }

  // Update margin range
  const handleRangeChange = (value: number[]) => {
    setMarginRange(value as [number, number])
    setMarginCategory("ALL") // Reset category when manual range is set
    onFilterChange?.({ minMargin: value[0], maxMargin: value[1] })
  }

  // Toggle sort order
  const handleSortToggle = () => {
    const newOrder = marginSortOrder === "asc" ? "desc" : 
                    marginSortOrder === "desc" ? undefined : "asc"
    setMarginSortOrder(newOrder)
    onFilterChange?.({ sortBy: newOrder ? "margin" : undefined, sortOrder: newOrder })
  }

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <Select value={marginCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Margin category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Margins</SelectItem>
            <SelectItem value="LOW">{MARGIN_CATEGORIES.LOW.label} (0-15%)</SelectItem>
            <SelectItem value="MEDIUM">{MARGIN_CATEGORIES.MEDIUM.label} (15-30%)</SelectItem>
            <SelectItem value="HIGH">{MARGIN_CATEGORIES.HIGH.label} (30%+)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Sliders className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <h4 className="font-medium">Margin Range</h4>
            <Slider
              value={marginRange}
              min={0}
              max={100}
              step={1}
              onValueChange={handleRangeChange}
              className="my-6"
            />
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="min-margin">Min (%)</Label>
                <Input
                  id="min-margin"
                  type="number"
                  value={marginRange[0]}
                  onChange={(e) => handleRangeChange([parseInt(e.target.value), marginRange[1]])}
                  className="w-16 h-8"
                  min={0}
                  max={marginRange[1]}
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="max-margin">Max (%)</Label>
                <Input
                  id="max-margin"
                  type="number"
                  value={marginRange[1]}
                  onChange={(e) => handleRangeChange([marginRange[0], parseInt(e.target.value)])}
                  className="w-16 h-8"
                  min={marginRange[0]}
                  max={100}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleSortToggle}
        className={marginSortOrder ? "bg-accent/20" : ""}
      >
        {marginSortOrder === "asc" ? (
          <SortAsc className="h-4 w-4 mr-2" />
        ) : marginSortOrder === "desc" ? (
          <SortDesc className="h-4 w-4 mr-2" />
        ) : (
          <SortAsc className="h-4 w-4 mr-2 opacity-50" />
        )}
        Sort by Margin
      </Button>
    </div>
  )
} 