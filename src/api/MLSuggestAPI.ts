import apiMLSuggest from "@/lib/axios";
import { SuggestionsResponse } from "@/types";
import { isAxiosError } from "axios";

export async function getSuggestions(message: string): Promise<SuggestionsResponse | undefined> {
  try {
    console.log({message});
    const url = `/resources/sites/MCO/autosuggest?showFilters=true&limit=6&api_version=2&q=${message}`;
    const { data } = await apiMLSuggest.get(url);
    return data as SuggestionsResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}
