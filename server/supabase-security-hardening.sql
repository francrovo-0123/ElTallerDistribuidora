-- =============================================================================
-- El Taller — Security hardening (post checkout-seguro / rls-seguro)
-- Ejecutar en: Supabase → SQL Editor → Run
--
-- NO rompe el flujo de checkout: sigue usando preview_pedido + crear_pedido_con_stock.
-- Endurece: validación de payload, IDOR por email, contacto spam, grants peligrosos.
-- =============================================================================

-- Safety net stock (por si no se corrió stock-concurrencia)
UPDATE public.productos SET stock = 0 WHERE stock < 0;
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_stock_non_negative;
ALTER TABLE public.productos
  ADD CONSTRAINT productos_stock_non_negative CHECK (stock >= 0);

-- -----------------------------------------------------------------------------
-- Contacto: límites anti-spam / anti-XSS payload
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Insertar mensajes contacto" ON public.mensajes_contacto;

CREATE POLICY "Insertar mensajes contacto"
ON public.mensajes_contacto FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(nombre)) BETWEEN 1 AND 120
  AND char_length(trim(email)) BETWEEN 5 AND 254
  AND position('@' in trim(email)) > 1
  AND char_length(trim(mensaje)) BETWEEN 1 AND 4000
  AND (telefono IS NULL OR char_length(trim(telefono)) BETWEEN 0 AND 40)
);

-- -----------------------------------------------------------------------------
-- Pedidos SELECT: IDOR — no reclamar pedidos ya ligados a otro user_id
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Cliente lee sus pedidos" ON public.pedidos;

CREATE POLICY "Cliente lee sus pedidos"
ON public.pedidos FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR (
    user_id IS NULL
    AND cliente_email IS NOT NULL
    AND lower(cliente_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

-- Nadie inserta pedidos directo (solo RPC SECURITY DEFINER)
DROP POLICY IF EXISTS "Insertar pedidos tienda" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir insertar pedidos" ON public.pedidos;

-- -----------------------------------------------------------------------------
-- Revocar grants peligrosos (si quedó stock-concurrencia viejo)
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.descontar_stock(bigint, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.descontar_stock(bigint, integer) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.registrar_uso_cupon(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_uso_cupon(text) FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- descontar_stock atómico (sin grant público)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.descontar_stock(p_producto_id bigint, p_cantidad integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_titulo text;
  v_stock integer;
  v_updated bigint;
BEGIN
  IF p_producto_id IS NULL THEN
    RAISE EXCEPTION 'Producto inválido';
  END IF;

  IF p_cantidad IS NULL OR p_cantidad < 1 OR p_cantidad > 100 THEN
    RAISE EXCEPTION 'Cantidad inválida';
  END IF;

  UPDATE public.productos
  SET stock = stock - p_cantidad
  WHERE id = p_producto_id
    AND stock >= p_cantidad
  RETURNING id INTO v_updated;

  IF v_updated IS NOT NULL THEN
    RETURN;
  END IF;

  SELECT titulo, stock INTO v_titulo, v_stock
  FROM public.productos WHERE id = p_producto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado (id %)', p_producto_id;
  END IF;

  RAISE EXCEPTION 'STOCK_INSUFICIENTE: "%" — pediste %, hay %',
    coalesce(v_titulo, 'Producto'), p_cantidad, coalesce(v_stock, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.descontar_stock(bigint, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.descontar_stock(bigint, integer) FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- preview_pedido: tope de ítems + talle sanitizado
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.preview_pedido(
  p_items jsonb,
  p_codigo_cupon text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_items_out jsonb := '[]'::jsonb;
  v_elem jsonb;
  v_prod_id bigint;
  v_cantidad integer;
  v_talle text;
  v_titulo text;
  v_precio numeric;
  v_img text;
  v_stock integer;
  v_subtotal numeric := 0;
  v_descuento numeric := 0;
  v_total numeric;
  v_cupon_codigo text;
  v_cupon_tipo text;
  v_cupon_valor numeric;
  v_cupon_activo boolean;
  v_cupon_usos integer;
  v_cupon_limite integer;
  v_agg record;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'El carrito está vacío.');
  END IF;

  IF jsonb_array_length(p_items) > 50 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Demasiados productos en el carrito.');
  END IF;

  FOR v_elem IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_prod_id := NULLIF(trim(coalesce(v_elem->>'id', '')), '')::bigint;
    EXCEPTION WHEN others THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Hay un producto inválido en el carrito.');
    END;

    IF v_prod_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Hay un producto inválido en el carrito.');
    END IF;

    BEGIN
      v_cantidad := GREATEST(coalesce((v_elem->>'cantidad')::integer, 1), 1);
    EXCEPTION WHEN others THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Cantidad inválida.');
    END;

    IF v_cantidad > 100 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Cantidad inválida.');
    END IF;

    v_talle := left(regexp_replace(coalesce(v_elem->>'talle', ''), '[[:cntrl:]]', '', 'g'), 40);
    v_talle := NULLIF(trim(v_talle), '');

    SELECT titulo, precio, img, stock
    INTO v_titulo, v_precio, v_img, v_stock
    FROM public.productos
    WHERE id = v_prod_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', format('Producto no encontrado (id %s).', v_prod_id)
      );
    END IF;

    v_items_out := v_items_out || jsonb_build_array(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', v_prod_id,
          'titulo', v_titulo,
          'precio', v_precio,
          'cantidad', v_cantidad,
          'talle', v_talle,
          'img', v_img,
          'stock', coalesce(v_stock, 0)
        )
      )
    );

    v_subtotal := v_subtotal + (coalesce(v_precio, 0) * v_cantidad);
  END LOOP;

  FOR v_agg IN
    SELECT
      (elem->>'id')::bigint AS producto_id,
      MAX(elem->>'titulo') AS titulo,
      SUM((elem->>'cantidad')::integer)::integer AS cantidad,
      MAX((elem->>'stock')::integer)::integer AS stock
    FROM jsonb_array_elements(v_items_out) AS elem
    GROUP BY (elem->>'id')::bigint
  LOOP
    IF v_agg.cantidad > coalesce(v_agg.stock, 0) THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', format(
          'STOCK_INSUFICIENTE: "%s" — pediste %s, hay %s',
          coalesce(v_agg.titulo, 'Producto'),
          v_agg.cantidad,
          coalesce(v_agg.stock, 0)
        ),
        'items', v_items_out
      );
    END IF;
  END LOOP;

  IF p_codigo_cupon IS NOT NULL AND trim(p_codigo_cupon) <> '' THEN
    IF char_length(trim(p_codigo_cupon)) > 64 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'CUPON_INVALIDO: código inválido', 'items', v_items_out, 'subtotal', v_subtotal);
    END IF;

    SELECT codigo, tipo, valor, activo, usos_actuales, limite_usos
    INTO v_cupon_codigo, v_cupon_tipo, v_cupon_valor, v_cupon_activo, v_cupon_usos, v_cupon_limite
    FROM public.cupones
    WHERE upper(codigo) = upper(trim(p_codigo_cupon));

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'CUPON_INVALIDO: no existe', 'items', v_items_out, 'subtotal', v_subtotal);
    END IF;

    IF NOT coalesce(v_cupon_activo, false) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'CUPON_INVALIDO: inactivo', 'items', v_items_out, 'subtotal', v_subtotal);
    END IF;

    IF v_cupon_limite IS NOT NULL AND coalesce(v_cupon_usos, 0) >= v_cupon_limite THEN
      RETURN jsonb_build_object('ok', false, 'error', 'CUPON_INVALIDO: sin usos disponibles', 'items', v_items_out, 'subtotal', v_subtotal);
    END IF;

    IF v_cupon_tipo = 'porcentaje' THEN
      v_descuento := round(v_subtotal * LEAST(GREATEST(coalesce(v_cupon_valor, 0), 0), 100) / 100.0, 2);
    ELSE
      v_descuento := GREATEST(coalesce(v_cupon_valor, 0), 0);
    END IF;

    IF v_descuento > v_subtotal THEN
      v_descuento := v_subtotal;
    END IF;
  END IF;

  v_total := GREATEST(v_subtotal - v_descuento, 0);

  RETURN jsonb_build_object(
    'ok', true,
    'items', v_items_out,
    'subtotal', v_subtotal,
    'descuento', v_descuento,
    'total', v_total,
    'cupon', CASE
      WHEN v_cupon_codigo IS NULL THEN NULL
      ELSE jsonb_build_object(
        'codigo', v_cupon_codigo,
        'tipo', v_cupon_tipo,
        'valor', v_cupon_valor
      )
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.preview_pedido(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_pedido(jsonb, text) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- crear_pedido_con_stock: validación estricta + email de sesión + precios DB
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crear_pedido_con_stock(
  p_pedido jsonb,
  p_codigo_cupon text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_in jsonb;
  v_items_out jsonb := '[]'::jsonb;
  v_elem jsonb;
  v_user_id uuid;
  v_prod_id bigint;
  v_cantidad integer;
  v_talle text;
  v_titulo text;
  v_precio numeric;
  v_img text;
  v_stock integer;
  v_subtotal numeric := 0;
  v_descuento numeric := 0;
  v_total numeric;
  v_cupon_tipo text;
  v_cupon_valor numeric;
  v_cupon_activo boolean;
  v_cupon_usos integer;
  v_cupon_limite integer;
  v_agg record;
  v_pedido jsonb;
  v_pedido_id bigint;
  v_nombre text;
  v_telefono text;
  v_direccion text;
  v_email text;
  v_jwt_email text;
BEGIN
  IF p_pedido IS NULL OR jsonb_typeof(p_pedido) <> 'object' THEN
    RAISE EXCEPTION 'Pedido inválido';
  END IF;

  v_nombre := left(trim(coalesce(p_pedido->>'cliente_nombre', '')), 120);
  v_telefono := left(regexp_replace(coalesce(p_pedido->>'cliente_telefono', ''), '[^0-9+()\-\s]', '', 'g'), 40);
  v_direccion := left(trim(coalesce(p_pedido->>'cliente_direccion', '')), 400);
  v_email := lower(left(trim(coalesce(p_pedido->>'cliente_email', '')), 254));
  v_jwt_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

  IF v_nombre IS NULL OR v_nombre = '' THEN
    RAISE EXCEPTION 'Nombre de cliente requerido';
  END IF;

  IF v_telefono IS NULL OR char_length(regexp_replace(v_telefono, '\D', '', 'g')) < 6 THEN
    RAISE EXCEPTION 'Teléfono de cliente requerido';
  END IF;

  IF v_direccion IS NULL OR v_direccion = '' THEN
    RAISE EXCEPTION 'Dirección de cliente requerida';
  END IF;

  -- Si hay sesión, el email del pedido es SIEMPRE el de la sesión (anti-spoof / IDOR)
  IF auth.uid() IS NOT NULL THEN
    IF v_jwt_email = '' THEN
      RAISE EXCEPTION 'Sesión sin email válido';
    END IF;
    v_email := v_jwt_email;
    v_user_id := auth.uid();
  ELSE
    v_user_id := NULL;
    IF v_email = '' OR v_email = 'invitado' THEN
      v_email := NULL;
    ELSIF v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
      RAISE EXCEPTION 'Email de cliente inválido';
    END IF;
  END IF;

  BEGIN
    IF NULLIF(p_pedido->>'user_id', '') IS NOT NULL
       AND (p_pedido->>'user_id')::uuid IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'No podés crear un pedido para otro usuario';
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'user_id inválido';
  END;

  v_items_in := coalesce(p_pedido->'items', '[]'::jsonb);
  IF jsonb_typeof(v_items_in) <> 'array' OR jsonb_array_length(v_items_in) < 1 THEN
    RAISE EXCEPTION 'El pedido no tiene productos';
  END IF;

  IF jsonb_array_length(v_items_in) > 50 THEN
    RAISE EXCEPTION 'Demasiados productos en el pedido';
  END IF;

  FOR v_elem IN SELECT value FROM jsonb_array_elements(v_items_in)
  LOOP
    BEGIN
      v_prod_id := NULLIF(trim(coalesce(v_elem->>'id', '')), '')::bigint;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Producto inválido en el pedido';
    END;

    IF v_prod_id IS NULL THEN
      RAISE EXCEPTION 'Producto inválido en el pedido';
    END IF;

    BEGIN
      v_cantidad := GREATEST(coalesce((v_elem->>'cantidad')::integer, 1), 1);
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END;

    IF v_cantidad > 100 THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END IF;

    v_talle := left(regexp_replace(coalesce(v_elem->>'talle', ''), '[[:cntrl:]]', '', 'g'), 40);
    v_talle := NULLIF(trim(v_talle), '');

    SELECT titulo, precio, img, stock
    INTO v_titulo, v_precio, v_img, v_stock
    FROM public.productos
    WHERE id = v_prod_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado (id %)', v_prod_id;
    END IF;

    IF coalesce(v_precio, 0) < 0 THEN
      RAISE EXCEPTION 'Precio inválido en catálogo (id %)', v_prod_id;
    END IF;

    v_items_out := v_items_out || jsonb_build_array(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', v_prod_id,
          'titulo', v_titulo,
          'precio', v_precio,
          'cantidad', v_cantidad,
          'talle', v_talle,
          'img', v_img
        )
      )
    );

    v_subtotal := v_subtotal + (v_precio * v_cantidad);
  END LOOP;

  IF p_codigo_cupon IS NOT NULL AND trim(p_codigo_cupon) <> '' THEN
    IF char_length(trim(p_codigo_cupon)) > 64 THEN
      RAISE EXCEPTION 'CUPON_INVALIDO: código inválido';
    END IF;

    SELECT tipo, valor, activo, usos_actuales, limite_usos
    INTO v_cupon_tipo, v_cupon_valor, v_cupon_activo, v_cupon_usos, v_cupon_limite
    FROM public.cupones
    WHERE upper(codigo) = upper(trim(p_codigo_cupon))
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CUPON_INVALIDO: no existe';
    END IF;

    IF NOT coalesce(v_cupon_activo, false) THEN
      RAISE EXCEPTION 'CUPON_INVALIDO: inactivo';
    END IF;

    IF v_cupon_limite IS NOT NULL
       AND coalesce(v_cupon_usos, 0) >= v_cupon_limite THEN
      RAISE EXCEPTION 'CUPON_INVALIDO: sin usos disponibles';
    END IF;

    IF v_cupon_tipo = 'porcentaje' THEN
      v_descuento := round(v_subtotal * LEAST(GREATEST(coalesce(v_cupon_valor, 0), 0), 100) / 100.0, 2);
    ELSE
      v_descuento := GREATEST(coalesce(v_cupon_valor, 0), 0);
    END IF;

    IF v_descuento > v_subtotal THEN
      v_descuento := v_subtotal;
    END IF;
  END IF;

  v_total := GREATEST(v_subtotal - v_descuento, 0);

  FOR v_agg IN
    SELECT
      (elem->>'id')::bigint AS producto_id,
      SUM((elem->>'cantidad')::integer)::integer AS cantidad
    FROM jsonb_array_elements(v_items_out) AS elem
    GROUP BY (elem->>'id')::bigint
    ORDER BY 1
  LOOP
    PERFORM public.descontar_stock(v_agg.producto_id, v_agg.cantidad);
  END LOOP;

  INSERT INTO public.pedidos (
    cliente_nombre,
    cliente_telefono,
    cliente_direccion,
    cliente_email,
    user_id,
    total,
    estado,
    metodo_pago,
    items
  )
  VALUES (
    v_nombre,
    v_telefono,
    NULLIF(v_direccion, ''),
    v_email,
    v_user_id,
    v_total,
    'Pendiente',
    'Transferencia Bancaria',
    v_items_out
  )
  RETURNING id INTO v_pedido_id;

  SELECT to_jsonb(p.*)
  INTO v_pedido
  FROM public.pedidos p
  WHERE p.id = v_pedido_id;

  IF p_codigo_cupon IS NOT NULL AND trim(p_codigo_cupon) <> '' THEN
    PERFORM public.registrar_uso_cupon(p_codigo_cupon);
  END IF;

  RETURN v_pedido;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_pedido_con_stock(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_pedido_con_stock(jsonb, text) TO anon, authenticated;

-- Cupones: solo admin lee la tabla
DROP POLICY IF EXISTS "Lectura publica cupones" ON public.cupones;
DROP POLICY IF EXISTS "Permitir lectura de cupones" ON public.cupones;
DROP POLICY IF EXISTS "Admin lee cupones" ON public.cupones;

CREATE POLICY "Admin lee cupones"
ON public.cupones FOR SELECT
TO authenticated
USING (public.is_admin());
