import { apiML } from "@/lib/axios";
import { SearchResponse } from "@/types";
import { isAxiosError } from "axios";

export async function searchTerm(term: string) {
  try {
    const encodedTerm = encodeURIComponent(term);
    const { data } = await apiML<SearchResponse>(
      `/sites/MCO/search?q=${encodedTerm}&limit=6`
    );
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}
