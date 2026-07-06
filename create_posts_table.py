import requests
import json

SUPABASE_ACCESS_TOKEN = "sbp_ce123ff934f91824060169e3111a8bf5e651f0d2"
PROJECT_REF = "wrybqqitsylqyhgzodyc"

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

headers = {
    "Authorization": f"Bearer {SUPABASE_ACCESS_TOKEN}",
    "Content-Type": "application/json",
    "User-Agent": "PostmanRuntime/7.26.8"
}

sql = """create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  \"userId\" text not null,
  image text not null,
  caption text,
  date timestamp with time zone default now(),
  type text check (type in ('feed', 'carousel', 'reels', 'story')),
  status text check (status in ('draft', 'scheduled', 'posted', 'rascunho')),
  cta text,
  hashtags jsonb,
  title text
);

-- Ativar Row Level Security (RLS) para proteger os dados
alter table posts enable row level security;

-- Criar política para permitir que o usuário apenas veja e edite seus próprios posts
create policy \"Usuários podem ver seus próprios posts\" on posts
  for select using (auth.uid()::text = \"userId\");

create policy \"Usuários podem inserir seus próprios posts\" on posts
  for insert with check (auth.uid()::text = \"userId\");

create policy \"Usuários podem atualizar seus próprios posts\" on posts
  for update using (auth.uid()::text = \"userId\");

create policy \"Usuários podem deletar seus próprios posts\" on posts
  for delete using (auth.uid()::text = \"userId\");"""

payload = {"sql": sql}

response = requests.post(url, headers=headers, data=json.dumps(payload))
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
