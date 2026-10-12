import { apiClient } from './apiClient';
import { SearchResults, SearchHistoryItem } from '../types';

export const searchService = {
  search: (query: string) =>
    apiClient.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`),

  getKeywordSuggestions: (query: string) =>
    apiClient.get<{ suggestions: string[] }>(`/search/suggestions?q=${encodeURIComponent(query)}`),

  getHistory: () =>
    apiClient.get<{ history: SearchHistoryItem[] }>('/search/history'),

  addHistory: (query: string) =>
    apiClient.post<{ success: boolean; item: SearchHistoryItem }>('/search/history', { query }),

  deleteHistoryItem: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/search/history/${id}`),

  clearAllHistory: () =>
    apiClient.delete<{ success: boolean }>('/search/history/all'),
};
