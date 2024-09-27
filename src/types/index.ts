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

// ----

export type SearchResponse = {
  site_id: string;
  country_default_time_zone: string;
  query: string;
  paging: {
    total: number;
    primary_results: number;
    offset: number;
    limit: number;
  };
  results: Result[];
  user_context: unknown;
};

type Result = {
  id: string;
  title: string;
  condition: string;
  thumbnail_id: string;
  catalog_product_id: string;
  listing_type_id: string;
  sanitized_title: string;
  permalink: string;
  buying_mode: string;
  site_id: string;
  category_id: string;
  domain_id: string;
  thumbnail: string;
  currency_id: string;
  order_backend: number;
  price: number;
  original_price: number | null;
  sale_price: SalePrice;
  available_quantity: number;
  official_store_id: number | null;
  use_thumbnail_id: boolean;
  accepts_mercadopago: boolean;
  shipping: Shipping;
  stop_time: string;
  seller: Seller;
  attributes: Attribute[];
  installments: Installments;
  winner_item_id: string | null;
  catalog_listing: boolean;
  discounts: unknown;
  promotions: unknown[];
  differential_pricing: DifferentialPricing;
  inventory_id: string;
};

type SalePrice = {
  price_id: string;
  amount: number;
  conditions: Conditions;
  currency_id: string;
  exchange_rate: unknown;
  payment_method_prices: unknown[];
  payment_method_type: string;
  regular_amount: number | null;
  type: string;
  metadata: unknown;
};

type Conditions = {
  eligible: boolean;
  context_restrictions: unknown[];
  start_time: string | null;
  end_time: string | null;
};

type Shipping = {
  store_pick_up: boolean;
  free_shipping: boolean;
  logistic_type: string;
  mode: string;
  tags: string[];
  benefits: unknown;
  promise: unknown;
  shipping_score: number;
};

type Seller = {
  id: number;
  nickname: string;
};

type Attribute = {
  id: string;
  name: string;
  value_id: string | null;
  value_name: string | null;
  attribute_group_id: string;
  attribute_group_name: string;
  value_struct: ValueStruct | null;
  values: Value[];
  source: number;
  value_type: string;
};

type ValueStruct = {
  number: number;
  unit: string;
};

type Value = {
  id: string | null;
  name: string | null;
  struct: ValueStruct | null;
  source: number;
};

type Installments = {
  quantity: number;
  amount: number;
  rate: number;
  currency_id: string;
};

type DifferentialPricing = {
  id: number;
};
