-- Create new ticks table for granular tick storage
create table if not exists public.ticks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  epoch_id uuid references public.epochs(id),
  timestamp timestamptz not null,
  price float8 not null,
  market text not null,
  tick_data jsonb,
  created_at timestamptz default now()
);

-- Index for fast querying by user and epoch
create index if not exists idx_ticks_user_id on public.ticks(user_id);
create index if not exists idx_ticks_epoch_id on public.ticks(epoch_id);

-- (Optional) Function to assign last N ticks to an epoch efficiently
create or replace function assign_ticks_to_epoch(user_id uuid, epoch_id uuid, tick_count int)
returns void as $$
begin
  update public.ticks
    set epoch_id = assign_ticks_to_epoch.epoch_id
  where user_id = assign_ticks_to_epoch.user_id
    and epoch_id is null
  order by timestamp desc
  limit assign_ticks_to_epoch.tick_count;
end;
$$ language plpgsql;
