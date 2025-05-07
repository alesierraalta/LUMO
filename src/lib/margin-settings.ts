"use client";

/**
 * This file contains the margin threshold settings and utilities 
 * for managing low, medium, and high margins throughout the application
 */

import { z } from "zod";

// Schema for margin threshold settings
export const MarginThresholdsSchema = z.object({
  low: z.object({
    min: z.number().min(0).default(0),
    max: z.number().min(0).max(100).default(15)
  }),
  medium: z.object({
    min: z.number().min(0).default(15),
    max: z.number().min(0).max(100).default(30)
  }),
  high: z.object({
    min: z.number().min(0).default(30),
    max: z.number().min(0).max(100).default(100)
  })
});

export type MarginThresholds = z.infer<typeof MarginThresholdsSchema>;

// Default margin threshold settings
export const DEFAULT_MARGIN_THRESHOLDS: MarginThresholds = {
  low: { min: 0, max: 15 },
  medium: { min: 15, max: 30 },
  high: { min: 30, max: 100 }
};

// LocalStorage key for margin settings
const MARGIN_SETTINGS_KEY = 'inventory-app-margin-settings';

/**
 * Gets the current margin threshold settings
 * Falls back to default settings if none are saved
 */
export function getMarginThresholds(): MarginThresholds {
  if (typeof window === 'undefined') {
    return DEFAULT_MARGIN_THRESHOLDS;
  }
  
  const savedSettings = localStorage.getItem(MARGIN_SETTINGS_KEY);
  if (!savedSettings) {
    return DEFAULT_MARGIN_THRESHOLDS;
  }
  
  try {
    const parsed = JSON.parse(savedSettings);
    const validated = MarginThresholdsSchema.safeParse(parsed);
    
    if (validated.success) {
      return validated.data;
    }
    
    // If validation fails, return defaults
    return DEFAULT_MARGIN_THRESHOLDS;
  } catch (error) {
    console.error('Error loading margin settings:', error);
    return DEFAULT_MARGIN_THRESHOLDS;
  }
}

/**
 * Saves the margin threshold settings to localStorage
 */
export function saveMarginThresholds(settings: MarginThresholds): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const validated = MarginThresholdsSchema.safeParse(settings);
    
    if (validated.success) {
      localStorage.setItem(MARGIN_SETTINGS_KEY, JSON.stringify(validated.data));
    } else {
      console.error('Invalid margin settings:', validated.error);
    }
  } catch (error) {
    console.error('Error saving margin settings:', error);
  }
}

/**
 * Gets the margin category for a value
 */
export function getMarginCategory(margin: number): 'low' | 'medium' | 'high' {
  const thresholds = getMarginThresholds();
  
  if (margin <= thresholds.low.max) return 'low';
  if (margin <= thresholds.medium.max) return 'medium';
  return 'high';
}

/**
 * Gets a color based on margin category
 */
export function getMarginColor(margin: number): string {
  const category = getMarginCategory(margin);
  
  switch (category) {
    case 'low':
      return 'var(--chart-1)';
    case 'medium':
      return 'var(--chart-2)';
    case 'high':
      return 'var(--chart-3)';
    default:
      return 'var(--chart-1)';
  }
}

/**
 * Gets a label for a margin category
 */
export function getMarginLabel(category: 'low' | 'medium' | 'high'): string {
  switch (category) {
    case 'low':
      return 'Margen Bajo';
    case 'medium':
      return 'Margen Medio';
    case 'high':
      return 'Margen Alto';
    default:
      return 'Desconocido';
  }
} 