import type { CreateTemplateItemInput, TemplateItem } from './types';

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function makeLocalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function listTemplateItems(): Promise<ServiceResult<TemplateItem[]>> {
  return {
    data: [],
    error: null,
  };
}

export async function createTemplateItem(
  input: CreateTemplateItemInput,
): Promise<ServiceResult<TemplateItem>> {
  const item: TemplateItem = {
    id: makeLocalId('template'),
    label: input.label,
    createdAt: new Date().toISOString(),
  };

  return {
    data: item,
    error: null,
  };
}
