export type PlanningSuggestionType =
  | 'milestone'
  | 'tiny_task'
  | 'review_action';

export interface PlanningSuggestion {
  id: string;
  type: PlanningSuggestionType;
  title: string;
  description?: string;
  actionLabel: string;
}