# 📲 Mascotes Pet Shop

É um aplicativo simples e eficiente para o controle de vendas, contas a receber e contas a pagar.

Pensado para qualquer pessoa que deseja organizar seus recebimentos com clareza e agilidade.

🧩 Ideal para quem busca praticidade sem abrir mão do controle.

🔍 Funcionalidades principais:

- **Autenticação:**
  - Login seguro via Supabase Auth (e-mail e senha).

  - Cadastro de usuário

  - Esqueci minha senha

- **Cadastro rápido de clientes**
  - Permite adicionar, editar, ativar/desativar e excluir clientes. Cada cliente possui nome, e-mail, celular e status (ativo/inativo).

- **Cadastro do recebimento**
  - Registre valores a receber, associando-os a um cliente, com data de vencimento, valor, status de pagamento e ativação.

  - **Visualização de Recebimentos:**
    - Veja todos os recebimentos cadastrados, filtrando por cliente, data ou valor. Exibe status de pagamento (pago/aguardando), valor, data e cliente associado.

  - **Busca e Filtros:**
    - Pesquise rapidamente por nome do cliente, data de recebimento ou valor.

  - **Envio de E-mail:**
    - Envio automático de e-mail dois dias antes do vencimento do recebimento.

- **Sobre**
  - Mostra o objetivo do aplicativo

> Outras funcionalidades:

- **Paginação:**  
  Controle o número de itens exibidos por página e navegue facilmente entre páginas.

- **Ações rápidas:**  
  Edite, exclua, marque como recebido ou ative/desative recebimentos diretamente na lista.

- **Responsividade:**  
  Interface adaptada para desktop e dispositivos móveis, alternando entre visualização em tabela e cartões.

- **Notificações e Diálogos:**  
  Confirmação de exclusão, recebimento e exibição de mensagens de erro/sucesso.

- **Controle de Acesso:**  
  Permissões diferenciadas para usuários comuns e administradores (RLS no banco).

- **Atualização em tempo real:**  
  Recebimentos e clientes são atualizados automaticamente via Supabase Realtime.

# ⚙️ Tecnologias Utilizadas

> Este projeto foi desenvolvido com foco na simplicidade e eficiência, utilizando tecnologias modernas e de fácil integração:

## 🧩 Frontend: React

- Interface responsiva e intuitiva

- Componentização com React Hooks e Context API para melhor gerenciamento de estado

- Estilização com CSS Modules para personalização visual

- Validação de formulários com React Hook Form

## 🗄️ Backend-as-a-Service: Supabase

- Autenticação segura com Supabase Auth (login por e-mail e senha)

- Armazenamento de dados em PostgreSQL com consultas otimizadas

- Regras de acesso via Row Level Security (RLS)

- Notificações em tempo real com Supabase Realtime (para status de pagamento)

- Hospedagem e APIs prontas para uso sem necessidade de configuração de servidor

## 🗂️Esquema das tabelas, views e policies do banco de dados Supabase:

```
🗂️ Tabela `business`

create table public.business (
  id uuid not null default gen_random_uuid (),
  business_name text null,
  responsible_name text null,
  email character varying null,
  mobile character varying null,
  active boolean null default false,
  created_at timestamp without time zone null default now(),
  constraint business_pkey primary key (id)
) TABLESPACE pg_default;

🗂️ Tabela `users`

create table public.users (
  id uuid not null default gen_random_uuid (),
  full_name text null,
  email text null,
  active boolean null,
  created_at timestamp without time zone not null default now(),

  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_name_key unique (full_name),
) TABLESPACE pg_default;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

  -- Habilita a Segurança a Nível de Linha (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;


🗂️ Tabela `customer`

create table public.customer (
  id uuid not null default gen_random_uuid (),
  name character varying null,
  email character varying null,
  mobile character varying null,
  receive_billing_email boolean null default true,
  active boolean null default false,
  user_id uuid null,
  created_at timestamp without time zone null default now(),
  constraint customer_pkey primary key (id)
) TABLESPACE pg_default;

🗂️ Tabela `accounts_receivable`

create table public.accounts_receivable (
  id uuid not null default gen_random_uuid (),
  received_date date not null default now(),
  payment_received_at date null,
  amount_to_receive numeric not null default '0'::numeric,
  custumer_id uuid not null,
  created_at timestamp with time zone not null default now(),
  active boolean not null default true,
  user_id uuid not null,
  email_send boolean null default false,
  constraint accounts_receivable_pkey primary key (id),
  constraint accounts_receivable_custumer_id_fkey foreign KEY (custumer_id) references customer (id)
) TABLESPACE pg_default;

🗂️ Tabela `profiles`

- Cria a tabela para perfis de usuário públicos

CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role text DEFAULT 'user'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

🗂️ View `accounts_receivable_view`

-- Cria view para busca por name de customer, received_date e amount_to_receive

CREATE VIEW public.accounts_receivable_view WITH (security_invoker=on) AS
SELECT
  ar.id,
  ar.received_date,
  to_char(ar.received_date, 'DD/MM/YYYY') AS received_text,
  ar.payment_received_at,
  ar.amount_to_receive,
  ROUND(ar.amount_to_receive, 2)::text AS amount_text,
  ar.created_at,
  ar.custumer_id,
  ar.active,
  ar.user_id,
  ar.email_send,
  c.name ,
  c.email
FROM public.accounts_receivable ar
JOIN public.customer c ON c.id = ar.custumer_id;

🗂️ Políticas de segurança:

-- Habilita a Segurança a Nível de Linha (RLS)
ALTER TABLE public.business ENABLE ROW LEVEL SECURITY;

-- Cria uma nova política de CREATE,UPDATE,DELETE E SELECT que inclui administradores
CREATE POLICY "Enable all operations for users and admins"
ON public.business
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);

-- Habilita a Segurança a Nível de Linha (RLS)
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;

-- Cria uma nova política de CREATE,UPDATE,DELETE E SELECT que inclui administradores
CREATE POLICY "Enable all operations for users and admins"
ON public.customer
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);

-- Habilita a Segurança a Nível de Linha (RLS)
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;

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
```

## 🛠️ Criado por Milton Tomé da Silva (11) 9.6707-9318
