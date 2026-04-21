-- 002_admin_verify.sql

-- 1. Agregar 'admin' como valor válido de role (si usaste CHECK constraint)
-- Primero revisamos cómo quedó definido el campo role en 001_profiles.sql
-- Si no tenías CHECK constraint, este bloque no hace nada dañino

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('cliente', 'abogado', 'admin'));

-- 2. Columna verified ya existe en lawyer_profiles (Sprint 2)
-- Solo confirmamos que es boolean con default false
ALTER TABLE public.lawyer_profiles
  ALTER COLUMN verified SET DEFAULT false;

-- 3. RLS: solo admin puede actualizar verified en lawyer_profiles
CREATE POLICY "admin_puede_verificar_abogado"
  ON public.lawyer_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );