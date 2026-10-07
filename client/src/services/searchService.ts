import { apiClient } from './apiClient';
import { SearchResults } from '../types';

export const searchService = {
  search: (query: string) =>
    apiClient.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
};
