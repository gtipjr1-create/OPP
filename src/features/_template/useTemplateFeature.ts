'use client';

import { useCallback, useState } from 'react';

import { createTemplateItem, listTemplateItems } from './service';
import type { TemplateItem } from './types';

export function useTemplateFeature() {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await listTemplateItems();
    setItems(result.data ?? []);
    setError(result.error);
    setIsLoading(false);
  }, []);

  const addItem = useCallback(async (label: string) => {
    const normalizedLabel = label.trim();
    if (!normalizedLabel) {
      return;
    }

    const result = await createTemplateItem({ label: normalizedLabel });
    if (result.error || !result.data) {
      setError(result.error ?? 'Unable to create item.');
      return;
    }

    setItems((previous) => [result.data as TemplateItem, ...previous]);
  }, []);

  return {
    items,
    isLoading,
    error,
    hasItems: items.length > 0,
    reload: load,
    addItem,
  };
}