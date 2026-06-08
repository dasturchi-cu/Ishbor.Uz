-- Mavjud xizmatlarga default paketlar

update public.services
set
  delivery_days = coalesce(nullif(delivery_days, 0), 5),
  packages = case
    when packages is null or packages = '[]'::jsonb then jsonb_build_array(
      jsonb_build_object('id', 'basic', 'label_key', 'package_basic', 'price', price, 'delivery_days', coalesce(nullif(delivery_days, 0), 5)),
      jsonb_build_object('id', 'standard', 'label_key', 'package_standard', 'price', round(price * 1.5), 'delivery_days', greatest(1, coalesce(nullif(delivery_days, 0), 5) - 1)),
      jsonb_build_object('id', 'premium', 'label_key', 'package_premium', 'price', round(price * 2.2), 'delivery_days', greatest(1, coalesce(nullif(delivery_days, 0), 5) - 2))
    )
    else packages
  end
where packages is null or packages = '[]'::jsonb;
