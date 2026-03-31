-- Pricing history for model cost tracking across price changes

create table public.pricing_history (
  id bigint generated always as identity primary key,
  model text not null,
  input_per_1m numeric(10,4) not null,
  output_per_1m numeric(10,4) not null,
  cache_read_per_1m numeric(10,4) not null,
  cache_write_per_1m numeric(10,4) not null,
  effective_from timestamptz not null default now(),
  created_at timestamptz default now()
);

create index idx_pricing_model on public.pricing_history(model, effective_from desc);

-- Seed current pricing (USD per 1M tokens)
insert into public.pricing_history (model, input_per_1m, output_per_1m, cache_read_per_1m, cache_write_per_1m) values
  ('claude-opus-4-6', 5.0, 25.0, 0.5, 6.25),
  ('claude-sonnet-4-6', 3.0, 15.0, 0.3, 3.75),
  ('claude-haiku-4-5', 0.8, 4.0, 0.08, 1.0);
