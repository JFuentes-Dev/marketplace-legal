-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- Tabla profiles (extiende auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('cliente', 'abogado')),
  nombre text not null,
  apellido text not null,
  email text not null,
  telefono text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla lawyer_profiles (datos adicionales solo para abogados)
create table public.lawyer_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  rut text not null,
  numero_colegio text,
  especialidades text[] default '{}',
  bio text,
  tarifa_hora numeric(10,2),
  years_experiencia int,
  verified boolean default false,
  created_at timestamptz default now()
);

-- RLS: activar seguridad por fila
alter table public.profiles enable row level security;
alter table public.lawyer_profiles enable row level security;

-- Políticas profiles
create policy "Usuarios ven su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuarios actualizan su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Perfiles de abogados son públicos"
  on public.profiles for select
  using (role = 'abogado');

-- Políticas lawyer_profiles
create policy "Abogado ve su propio perfil extendido"
  on public.lawyer_profiles for select
  using (auth.uid() = id);

create policy "Abogado actualiza su propio perfil extendido"
  on public.lawyer_profiles for update
  using (auth.uid() = id);

create policy "Perfiles extendidos de abogados son públicos"
  on public.lawyer_profiles for select
  using (true);

-- Trigger para actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger para crear profile automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nombre, apellido, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'apellido', ''),
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
