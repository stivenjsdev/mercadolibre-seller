type FilterValue = {
  id: string;
  name: string;
};

type Filter = {
  id: string;
  name: string;
  values: FilterValue[];
};

type SuggestedQueries = {
  q: string;
  match_start: number;
  match_end: number;
  is_verified_store: boolean;
  filters: Filter[];
};

export type SuggestionsResponse = {
  q: string;
  suggested_queries: SuggestedQueries[];
};