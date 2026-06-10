-- Badge count va inbox unread so'rovlari uchun partial indexlar
create index if not exists messages_receiver_unread_idx
  on public.messages (receiver_id)
  where read_at is null;

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- Dashboard orders: client yoki freelancer bo'yicha tez filter
create index if not exists orders_client_created_idx
  on public.orders (client_id, created_at desc);

create index if not exists orders_freelancer_created_idx
  on public.orders (freelancer_id, created_at desc);
