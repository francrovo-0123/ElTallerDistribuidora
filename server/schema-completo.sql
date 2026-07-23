-- =============================================================================
-- El Taller Distribuidora — Schema completo de Supabase
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Incluye: tablas, índices, seeds, RLS y políticas de Storage
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) PRODUCTOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.productos (
  id            bigserial PRIMARY KEY,
  titulo        text NOT NULL,
  categoria     text,
  precio        numeric(12, 2) NOT NULL DEFAULT 0,
  stock         integer NOT NULL DEFAULT 0,
  img           text,
  exclusivo     boolean NOT NULL DEFAULT false,
  es_destacado  boolean NOT NULL DEFAULT false,
  en_oferta     boolean NOT NULL DEFAULT false,
  envio_gratis  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Por si la tabla ya existía sin columnas nuevas
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS exclusivo boolean NOT NULL DEFAULT false;
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS es_destacado boolean NOT NULL DEFAULT false;
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS en_oferta boolean NOT NULL DEFAULT false;
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS envio_gratis boolean NOT NULL DEFAULT true;

UPDATE public.productos SET stock = 0 WHERE stock < 0;
ALTER TABLE public.productos
  DROP CONSTRAINT IF EXISTS productos_stock_non_negative;
ALTER TABLE public.productos
  ADD CONSTRAINT productos_stock_non_negative CHECK (stock >= 0);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_exclusivo ON public.productos (exclusivo);
CREATE INDEX IF NOT EXISTS idx_productos_portada
  ON public.productos (es_destacado, en_oferta);

-- Helper admin (mismo email que CORREO_ADMIN en el frontend)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    lower((auth.jwt() ->> 'email')) = lower('eltalleradmin@gmail.com'),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Stock: sin grant público (solo la usa crear_pedido_con_stock)
-- -----------------------------------------------------------------------------
-- Stock: sin grant público (solo la usa crear_pedido_con_stock)
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

  IF p_cantidad IS NULL OR p_cantidad < 1 THEN
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

  SELECT titulo, stock
  INTO v_titulo, v_stock
  FROM public.productos
  WHERE id = p_producto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado (id %)', p_producto_id;
  END IF;

  RAISE EXCEPTION 'STOCK_INSUFICIENTE: "%" — pediste %, hay %',
    coalesce(v_titulo, 'Producto'),
    p_cantidad,
    coalesce(v_stock, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.descontar_stock(bigint, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.descontar_stock(bigint, integer) FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- Cupón: registrar uso (solo interno; valida activo + límite)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_uso_cupon(p_codigo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id bigint;
  v_usos integer;
  v_limite integer;
  v_activo boolean;
BEGIN
  IF p_codigo IS NULL OR trim(p_codigo) = '' THEN
    RAISE EXCEPTION 'CUPON_INVALIDO: código vacío';
  END IF;

  SELECT id, usos_actuales, limite_usos, activo
  INTO v_id, v_usos, v_limite, v_activo
  FROM public.cupones
  WHERE upper(codigo) = upper(trim(p_codigo))
  FOR UPDATE;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'CUPON_INVALIDO: no existe';
  END IF;

  IF NOT coalesce(v_activo, false) THEN
    RAISE EXCEPTION 'CUPON_INVALIDO: inactivo';
  END IF;

  IF v_limite IS NOT NULL AND coalesce(v_usos, 0) >= v_limite THEN
    RAISE EXCEPTION 'CUPON_INVALIDO: sin usos disponibles';
  END IF;

  v_usos := coalesce(v_usos, 0) + 1;

  UPDATE public.cupones
  SET
    usos_actuales = v_usos,
    activo = CASE
      WHEN v_limite IS NOT NULL AND v_usos >= v_limite THEN false
      ELSE activo
    END
  WHERE id = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_uso_cupon(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_uso_cupon(text) FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- validar_cupon: UI del carrito (no lista todos los códigos)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validar_cupon(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_row_codigo text;
  v_row_tipo text;
  v_row_valor numeric;
  v_row_activo boolean;
  v_row_usos integer;
  v_row_limite integer;
BEGIN
  IF p_codigo IS NULL OR trim(p_codigo) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ingresá un código de cupón.');
  END IF;

  SELECT codigo, tipo, valor, activo, usos_actuales, limite_usos
  INTO v_row_codigo, v_row_tipo, v_row_valor, v_row_activo, v_row_usos, v_row_limite
  FROM public.cupones
  WHERE upper(codigo) = upper(trim(p_codigo));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'El cupón ingresado no existe.');
  END IF;

  IF NOT coalesce(v_row_activo, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este cupón no se encuentra activo.');
  END IF;

  IF v_row_limite IS NOT NULL
     AND coalesce(v_row_usos, 0) >= v_row_limite THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este cupón ya alcanzó el límite de usos.');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'codigo', v_row_codigo,
    'tipo', v_row_tipo,
    'valor', v_row_valor
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validar_cupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validar_cupon(text) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- crear_pedido_con_stock: precios + cupón + stock + pedido en UNA transacción
-- Ignora total/precio/estado/título enviados por el cliente.
-- -----------------------------------------------------------------------------
-- preview_pedido: el front solo manda id/cantidad/talle (+ cupón);
-- el servidor arma precios, stock disponible, descuento y total (sin crear pedido).
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

    v_talle := NULLIF(trim(coalesce(v_elem->>'talle', '')), '');

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

  -- Stock agregado
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
BEGIN
  IF p_pedido IS NULL OR jsonb_typeof(p_pedido) <> 'object' THEN
    RAISE EXCEPTION 'Pedido inválido';
  END IF;

  v_nombre := NULLIF(trim(coalesce(p_pedido->>'cliente_nombre', '')), '');
  v_telefono := NULLIF(trim(coalesce(p_pedido->>'cliente_telefono', '')), '');

  IF v_nombre IS NULL THEN
    RAISE EXCEPTION 'Nombre de cliente requerido';
  END IF;

  IF v_telefono IS NULL THEN
    RAISE EXCEPTION 'Teléfono de cliente requerido';
  END IF;

  v_items_in := coalesce(p_pedido->'items', '[]'::jsonb);
  IF jsonb_typeof(v_items_in) <> 'array' OR jsonb_array_length(v_items_in) < 1 THEN
    RAISE EXCEPTION 'El pedido no tiene productos';
  END IF;

  BEGIN
    v_user_id := NULLIF(p_pedido->>'user_id', '')::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'user_id inválido';
  END;

  IF v_user_id IS NOT NULL AND v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No podés crear un pedido para otro usuario';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_user_id := auth.uid();
  END IF;

  -- Reconstruir ítems con precio/título/img de la DB (ignora lo del cliente)
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

    v_talle := NULLIF(trim(coalesce(v_elem->>'talle', '')), '');

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

  -- Cupón: tipo/valor solo desde DB
  IF p_codigo_cupon IS NOT NULL AND trim(p_codigo_cupon) <> '' THEN
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

  -- Descontar stock (agregado por producto, ordenado para evitar deadlocks)
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
    NULLIF(trim(coalesce(p_pedido->>'cliente_direccion', '')), ''),
    NULLIF(trim(coalesce(p_pedido->>'cliente_email', '')), ''),
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

-- -----------------------------------------------------------------------------

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de productos" ON public.productos;
DROP POLICY IF EXISTS "Permitir insertar productos" ON public.productos;
DROP POLICY IF EXISTS "Permitir actualizar productos" ON public.productos;
DROP POLICY IF EXISTS "Permitir eliminar productos" ON public.productos;
DROP POLICY IF EXISTS "Lectura publica productos" ON public.productos;
DROP POLICY IF EXISTS "Admin inserta productos" ON public.productos;
DROP POLICY IF EXISTS "Admin actualiza productos" ON public.productos;
DROP POLICY IF EXISTS "Admin elimina productos" ON public.productos;

CREATE POLICY "Lectura publica productos"
ON public.productos FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin inserta productos"
ON public.productos FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza productos"
ON public.productos FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin elimina productos"
ON public.productos FOR DELETE
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2) PEDIDOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos (
  id                 bigserial PRIMARY KEY,
  cliente_nombre     text,
  cliente_telefono   text,
  cliente_direccion  text,
  cliente_email      text,
  user_id            uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  total              numeric(12, 2) NOT NULL DEFAULT 0,
  estado             text NOT NULL DEFAULT 'Pendiente',
  items              jsonb NOT NULL DEFAULT '[]'::jsonb,
  metodo_pago        text,
  codigo_seguimiento text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS cliente_email text;
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS metodo_pago text;
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS codigo_seguimiento text;

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_email
  ON public.pedidos (cliente_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_user_id
  ON public.pedidos (user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado
  ON public.pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at
  ON public.pedidos (created_at DESC);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir insertar pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir actualizar pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir eliminar pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Cliente lee sus pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Insertar pedidos tienda" ON public.pedidos;
DROP POLICY IF EXISTS "Admin actualiza pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Admin elimina pedidos" ON public.pedidos;

CREATE POLICY "Cliente lee sus pedidos"
ON public.pedidos FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR (
    cliente_email IS NOT NULL
    AND lower(cliente_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

-- Pedidos: insert solo vía RPC crear_pedido_con_stock (SECURITY DEFINER)
DROP POLICY IF EXISTS "Insertar pedidos tienda" ON public.pedidos;

CREATE POLICY "Admin actualiza pedidos"
ON public.pedidos FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin elimina pedidos"
ON public.pedidos FOR DELETE
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3) CUPONES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cupones (
  id             bigserial PRIMARY KEY,
  codigo         text NOT NULL,
  tipo           text NOT NULL CHECK (tipo IN ('porcentaje', 'fijo')),
  valor          numeric(12, 2) NOT NULL DEFAULT 0,
  limite_usos    integer,
  usos_actuales  integer NOT NULL DEFAULT 0,
  activo         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cupones_codigo_unique UNIQUE (codigo)
);

ALTER TABLE public.cupones DROP CONSTRAINT IF EXISTS cupones_valor_porcentaje_ok;
ALTER TABLE public.cupones ADD CONSTRAINT cupones_valor_porcentaje_ok
  CHECK (valor >= 0 AND (tipo <> 'porcentaje' OR valor <= 100));

CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON public.cupones (codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON public.cupones (activo);

ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de cupones" ON public.cupones;
DROP POLICY IF EXISTS "Permitir insertar cupones" ON public.cupones;
DROP POLICY IF EXISTS "Permitir actualizar cupones" ON public.cupones;
DROP POLICY IF EXISTS "Permitir eliminar cupones" ON public.cupones;
DROP POLICY IF EXISTS "Lectura publica cupones" ON public.cupones;
DROP POLICY IF EXISTS "Admin inserta cupones" ON public.cupones;
DROP POLICY IF EXISTS "Admin actualiza cupones" ON public.cupones;
DROP POLICY IF EXISTS "Admin elimina cupones" ON public.cupones;
DROP POLICY IF EXISTS "Admin lee cupones" ON public.cupones;

CREATE POLICY "Admin lee cupones"
ON public.cupones FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin inserta cupones"
ON public.cupones FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza cupones"
ON public.cupones FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin elimina cupones"
ON public.cupones FOR DELETE
TO authenticated
USING (public.is_admin());

-- Realtime opcional (admin ve usos en vivo)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cupones;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 4) CATEGORIAS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorias (
  id         bigserial PRIMARY KEY,
  nombre     text NOT NULL,
  orden      integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categorias_nombre_unique UNIQUE (nombre)
);

CREATE INDEX IF NOT EXISTS idx_categorias_orden ON public.categorias (orden);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir insertar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir actualizar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir eliminar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Lectura publica categorias" ON public.categorias;
DROP POLICY IF EXISTS "Admin escribe categorias" ON public.categorias;
DROP POLICY IF EXISTS "Admin actualiza categorias" ON public.categorias;
DROP POLICY IF EXISTS "Admin elimina categorias" ON public.categorias;

CREATE POLICY "Lectura publica categorias"
ON public.categorias FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin escribe categorias"
ON public.categorias FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza categorias"
ON public.categorias FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin elimina categorias"
ON public.categorias FOR DELETE
TO authenticated
USING (public.is_admin());

-- Seed de categorías del menú
INSERT INTO public.categorias (nombre, orden) VALUES
  ('Torpedos', 1),
  ('Camioneros', 2),
  ('Imperiales', 3),
  ('Bombillas', 4),
  ('Accesorios', 5),
  ('Termos', 6),
  ('Regalos Empresariales', 7)
ON CONFLICT (nombre) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5) CONFIGURACION (marquee / aviso de portada)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.configuracion (
  id              integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  marquee_texto   text DEFAULT '¡Bienvenidos a nuestra tienda online! Envíos a todo el país 🚚',
  marquee_activo  boolean NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.configuracion (id, marquee_texto, marquee_activo)
VALUES (1, '¡Bienvenidos a nuestra tienda online! Envíos a todo el país 🚚', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Permitir insertar configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Permitir actualizar configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Lectura publica configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Admin escribe configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Admin actualiza configuracion" ON public.configuracion;

CREATE POLICY "Lectura publica configuracion"
ON public.configuracion FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin escribe configuracion"
ON public.configuracion FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza configuracion"
ON public.configuracion FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6) MENSAJES DE CONTACTO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mensajes_contacto (
  id         bigserial PRIMARY KEY,
  nombre     text NOT NULL,
  telefono   text,
  email      text NOT NULL,
  mensaje    text NOT NULL,
  leido      boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensajes_contacto
  ADD COLUMN IF NOT EXISTS telefono text;

CREATE INDEX IF NOT EXISTS idx_mensajes_contacto_created
  ON public.mensajes_contacto (created_at DESC);

ALTER TABLE public.mensajes_contacto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insertar mensajes contacto" ON public.mensajes_contacto;
DROP POLICY IF EXISTS "Admin lee mensajes contacto" ON public.mensajes_contacto;
DROP POLICY IF EXISTS "Admin actualiza mensajes contacto" ON public.mensajes_contacto;
DROP POLICY IF EXISTS "Admin elimina mensajes contacto" ON public.mensajes_contacto;

CREATE POLICY "Insertar mensajes contacto"
ON public.mensajes_contacto FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(nombre)) > 0
  AND char_length(trim(email)) > 3
  AND char_length(trim(mensaje)) > 0
);

CREATE POLICY "Admin lee mensajes contacto"
ON public.mensajes_contacto FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin actualiza mensajes contacto"
ON public.mensajes_contacto FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin elimina mensajes contacto"
ON public.mensajes_contacto FOR DELETE
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7) STORAGE — bucket productos-img
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos-img', 'productos-img', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Lectura publica productos-img" ON storage.objects;
CREATE POLICY "Lectura publica productos-img"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'productos-img');

DROP POLICY IF EXISTS "Subida autenticada productos-img" ON storage.objects;
DROP POLICY IF EXISTS "Update autenticada productos-img" ON storage.objects;
DROP POLICY IF EXISTS "Delete autenticada productos-img" ON storage.objects;
DROP POLICY IF EXISTS "Admin sube productos-img" ON storage.objects;
DROP POLICY IF EXISTS "Admin actualiza productos-img" ON storage.objects;
DROP POLICY IF EXISTS "Admin elimina productos-img" ON storage.objects;

CREATE POLICY "Admin sube productos-img"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos-img' AND public.is_admin());

CREATE POLICY "Admin actualiza productos-img"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos-img' AND public.is_admin())
WITH CHECK (bucket_id = 'productos-img' AND public.is_admin());

CREATE POLICY "Admin elimina productos-img"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'productos-img' AND public.is_admin());

-- =============================================================================
-- Listo. Próximos pasos:
-- 1) Authentication → Providers → Email habilitado
-- 2) Crear usuario admin (mismo email que CORREO_ADMIN / is_admin())
-- 3) Pegar SUPABASE_URL y anon key en los archivos del client/
-- 4) Actualizar CBU / alias reales en client/checkout.html
-- =============================================================================
