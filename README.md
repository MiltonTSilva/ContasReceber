# 📲 Contas a Receber

É um aplicativo simples e eficiente para o controle de contas a receber.

Pensado para professores que desejam organizar seus recebimentos com clareza e agilidade.

🔍 Funcionalidades principais:

Cadastro rápido de alunos

Cadastro do recebimento

Visualização por aluno, data de vencimento, status de pagamento

🧩 Ideal para quem busca praticidade sem abrir mão do controle.

# ⚙️ Tecnologias Utilizadas

Este projeto foi desenvolvido com foco na simplicidade e eficiência, utilizando tecnologias modernas e de fácil integração:

## 🧩 Frontend: React

Interface responsiva e intuitiva, voltada para professores

Componentização com React Hooks e Context API para melhor gerenciamento de estado

Estilização com CSS Modules para personalização visual

Validação de formulários com React Hook Form

## 🗄️ Backend-as-a-Service: Supabase

Autenticação segura com Supabase Auth (login por e-mail e senha)

Armazenamento de dados em PostgreSQL com consultas otimizadas

Regras de acesso via Row Level Security (RLS)

Notificações em tempo real com Supabase Realtime (para status de pagamento)

Hospedagem e APIs prontas para uso sem necessidade de configuração de servidor

## 🗂️Esquema das tabelas:

```
🗂️ Tabela `users`

create table public.users (
full_name text null,
email text null,
created_at timestamp without time zone not null default now(),
id uuid not null default gen_random_uuid (),
constraint users_pkey primary key (id),
constraint users_email_key unique (email),
constraint users_name_key unique (full_name)
) TABLESPACE pg_default;

🗂️ Tabela `customer`

create table public.customer (
  id uuid not null default gen_random_uuid (),
  name character varying null,
  mail character varying null,
  mobile character varying null,
  active boolean null,
  create_at timestamp without time zone null default now(),
  constraint Cliente_pkey primary key (id)
) TABLESPACE pg_default;

🗂️ Tabela `accounts_receivable`

CREATE  TABLE public.accounts_receivable (
  id uuid not null default gen_random_uuid (),
  received_date date NULL DEFAULT now(),
  payment_received_at date NULL,
  amount_to_receive numeric NULL,
  costumer_id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT accounts_receivable_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_receivable_costumer_id_fkey FOREIGN KEY (costumer_id) REFERENCES customer(id)
) TABLESPACE pg_default;

-- Cria a tabela para perfis de usuário públicos
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role text DEFAULT 'user'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Habilita a Segurança a Nível de Linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Permite que usuários leiam todos os perfis (é público)
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT USING (true);

-- Política: Permite que usuários criem seu próprio perfil
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Política: Permite que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger: Cria um perfil automaticamente para cada novo usuário registrado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Cria uma nova política que permite TODAS as operações (SELECT, INSERT, UPDATE, DELETE)
-- para o usuário que é dono do registro.
CREATE POLICY "Users can manage their own customers."
ON public.customer FOR ALL
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );


```

## 🛠️ Criado por Milton Tomé da Silva (11) 9.6707-9318
