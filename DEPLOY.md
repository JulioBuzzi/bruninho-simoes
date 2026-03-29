# 🏟️ Bruninho e Simões — Guia Completo de Deploy

> Sistema de notas dos jogadores do Flamengo por jogo.

---

## 📁 Estrutura do Projeto

```
bruninho-simoes/
├── backend/          ← API Node.js (Express)
├── frontend/         ← Interface Next.js
└── database/
    └── schema.sql    ← Script completo do banco
```

---

## ⚙️ Tecnologias Utilizadas

| Camada    | Tecnologia         | Hospedagem gratuita |
|-----------|--------------------|---------------------|
| Frontend  | Next.js 14 (React) | Vercel              |
| Backend   | Node.js + Express  | Render              |
| Banco     | PostgreSQL         | Supabase            |
| Auth      | JWT + bcrypt       | (embutido no back)  |

---

## 🗄️ PASSO 1 — Banco de Dados no Supabase

### 1.1 Criar conta e projeto

1. Acesse [https://supabase.com](https://supabase.com) e clique em **"Start your project"**
2. Faça login com GitHub
3. Clique em **"New project"**
4. Preencha:
   - **Name:** `bruninho-simoes`
   - **Database Password:** crie uma senha forte (anote!) BruninhoESimoes
   - **Region:** South America (São Paulo)
5. Clique em **"Create new project"** e aguarde ~2 minutos

### 1.2 Rodar o Schema SQL

1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo `database/schema.sql`
4. Cole no editor e clique em **"Run"** (▶)
5. Você deve ver a mensagem `Success. No rows returned`

### 1.3 Pegar a connection string

1. Vá em **Settings → Database** no menu lateral
2. Em **"Connection string"**, selecione a aba **"URI"**
3. Copie a string — ela ficará assim:
   ```
   postgresql://postgres.apyibgjjllwugjzwdyat:BruninhoESimoes@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
   ```
4. **Guarde essa string** — você vai precisar no próximo passo

> ⚠️ **Importante:** troque `[SUA-SENHA]` pela senha que você criou no passo 1.1

---

## 🔐 PASSO 2 — Alterar Senha do Admin

A senha padrão é `admin123`. **Troque antes de fazer o deploy!**

No terminal, execute:

```bash
node -e "const b=require('bcryptjs'); b.hash('SUA_NOVA_SENHA',10).then(h=>console.log(h))"
```node -e "const b=require('bcryptjs'); b.hash(JULIO1234,10).then(h=>console.log(h))"

Ou instale o bcryptjs globalmente:
```bash
npm install -g bcryptjs
```

Depois, no SQL Editor do Supabase:
```sql
UPDATE users 
SET password_hash = '$2b$10$SEU_HASH_GERADO_AQUI'
WHERE username = 'admin';
```

---

## 🚀 PASSO 3 — Backend no Render

### 3.1 Criar conta

1. Acesse [https://render.com](https://render.com)
2. Faça login com GitHub

### 3.2 Subir o código para o GitHub

Primeiro, inicialize o repositório do **backend**:

```bash
cd bruninho-simoes/backend

# Inicializar git
git init
git add .
git commit -m "feat: initial backend setup"

# Criar repositório no GitHub (via GitHub CLI ou interface)
# Depois conectar:
git remote add origin https://github.com/SEU_USUARIO/bs-api.git
git push -u origin main
```

### 3.3 Criar o serviço no Render

1. No painel do Render, clique em **"New +"** → **"Web Service"**
2. Conecte sua conta GitHub se necessário
3. Selecione o repositório `bs-api`
4. Configure:
   - **Name:** `bruninho-simoes-api`
   - **Region:** Ohio (ou o mais próximo)
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Clique em **"Advanced"** para adicionar variáveis de ambiente:

| Key              | Value                                          |
|------------------|------------------------------------------------|
| `DATABASE_URL`   | (a string do Supabase do Passo 1.3)            |
| `JWT_SECRET`     | (uma string aleatória longa, ex: 64 caracteres)|
| `JWT_EXPIRES_IN` | `7d`                                           |
| `NODE_ENV`       | `production`                                   |
| `FRONTEND_URL`   | (preencher depois com a URL do Vercel)         |

6. Clique em **"Create Web Service"**
7. Aguarde o deploy (~3 min)
8. **Anote a URL do serviço**, ex: `https://bruninho-simoes-api.onrender.com`

> 💡 **Dica:** No plano gratuito do Render, a instância "hiberna" após 15 minutos de inatividade. O primeiro request pode demorar ~30s para "acordar". Isso é normal.

---

## 🌐 PASSO 4 — Frontend no Vercel

### 4.1 Subir o frontend para o GitHub

```bash
cd bruninho-simoes/frontend

git init
git add .
git commit -m "feat: initial frontend setup"

git remote add origin https://github.com/SEU_USUARIO/bs-frontend.git
git push -u origin main
```

### 4.2 Criar o projeto no Vercel

1. Acesse [https://vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **"Add New..."** → **"Project"**
4. Importe o repositório `bs-frontend`
5. Configure:
   - **Framework Preset:** Next.js (detectado automaticamente)
   - Em **"Environment Variables"**, adicione:

| Key                    | Value                                              |
|------------------------|----------------------------------------------------|
| `NEXT_PUBLIC_API_URL`  | `https://bruninho-simoes-api.onrender.com/api`     |

6. Clique em **"Deploy"**
7. Aguarde (~2 min) e **anote a URL** do frontend, ex: `https://bruninho-simoes.vercel.app`

### 4.3 Atualizar CORS no Render

Volte ao Render e atualize a variável:

| Key             | Value                                    |
|-----------------|------------------------------------------|
| `FRONTEND_URL`  | `https://bruninho-simoes.vercel.app`     |

O Render irá redeploiar automaticamente.

---

## 💻 PASSO 5 — Rodar Localmente (desenvolvimento)

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Backend

```bash
cd bruninho-simoes/backend

# Instalar dependências
npm install

# Criar arquivo .env (copiar o exemplo)
cp .env.example .env

# Editar o .env com suas configurações locais:
# DATABASE_URL=postgresql://... (seu Supabase ou PostgreSQL local)
# JWT_SECRET=qualquer-string-longa
# JWT_EXPIRES_IN=7d
# PORT=3001

# Rodar em modo desenvolvimento
npm run dev
```

A API estará disponível em: `http://localhost:3001`

### Frontend

```bash
cd bruninho-simoes/frontend

# Instalar dependências
npm install

# Criar arquivo .env.local
cp .env.local.example .env.local

# Editar o .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Rodar em modo desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:3000`

---

## 🔑 Primeiro Acesso ao Admin

1. Acesse: `https://SEU-SITE.vercel.app/admin/login`
2. **Usuário:** `admin`
3. **Senha:** `admin123` (ou a senha que você trocou no Passo 2)

### Fluxo recomendado de uso:

1. **Admin → Times** — Verifique se os times adversários estão cadastrados (já vêm 24 times pré-cadastrados)
2. **Admin → Jogadores** — Verifique se os jogadores do Flamengo estão corretos (20 jogadores pré-cadastrados)
3. **Admin → Jogos** — Crie um novo jogo, selecione os 11 titulares
4. **Admin → Notas** — Selecione o jogo e insira as notas do Bruninho e Simões (0 a 10)
5. **Pronto!** O jogo aparece na página principal com todas as informações

---

## 📊 Funcionalidades do Sistema

### Páginas públicas
- **/** — Lista de todos os jogos com filtros por campeonato e ano
- **/jogos/:id** — Detalhes do jogo: escalação, notas, MVP, Bagre do jogo
- **/jogadores** — Lista de jogadores com médias da temporada
- **/jogadores/:id** — Histórico completo de notas do jogador
- **/estatisticas** — Ranking geral, comparação Bruninho vs Simões, evolução mensal

### Área Admin (requer login)
- Criar/editar/excluir jogos
- Cadastrar titulares por jogo
- Inserir notas rapidamente em forma de tabela
- Gerenciar jogadores e times

---

## 🔧 Manutenção

### Alterar a senha do admin

No SQL Editor do Supabase:
```sql
-- Gere o hash com: node -e "require('bcryptjs').hash('nova_senha',10).then(console.log)"
UPDATE users 
SET password_hash = '$2b$10$HASH_AQUI'
WHERE username = 'admin';
```

### Adicionar novo usuário admin

```sql
-- Hash de 'senha123'
INSERT INTO users (username, password_hash) 
VALUES ('bruninho', '$2b$10$...');
```

### Backup do banco

No Supabase: **Settings → Database → Backups** (backups diários automáticos no plano gratuito)

---

## 🚀 Melhorias Futuras Sugeridas

- [ ] **Notificações push** quando um jogo novo for cadastrado
- [ ] **Upload de fotos** dos jogadores via Cloudinary/Supabase Storage
- [ ] **Compartilhamento social** — imagem gerada para stories do Instagram
- [ ] **PWA** — instalar como app no celular
- [ ] **Histórico de edições** — quem editou qual nota e quando
- [ ] **Sistema de comentários** por jogo
- [ ] **API pública** para fãs consultarem as notas
- [ ] **Comparação entre jogadores** lado a lado
- [ ] **Embate histórico** — quem foi o melhor jogador de todos os tempos pelo canal
- [ ] **Webhook YouTube** — criar jogo automaticamente quando vídeo é publicado

---

## ❓ Problemas Comuns

### "Cannot connect to database"
- Verifique se a `DATABASE_URL` está correta no Render
- Certifique-se que o banco Supabase está ativo (não pausado)

### "CORS error" no frontend
- Atualize a variável `FRONTEND_URL` no Render com a URL exata do Vercel (sem barra final)
- Redeploie o backend

### "JWT expired" (token expirado)
- Faça logout e login novamente na área admin

### API lenta no primeiro acesso
- Normal no plano gratuito do Render — a instância "hiberna" após inatividade
- Considere usar o [UptimeRobot](https://uptimerobot.com) gratuito para fazer ping a cada 14 minutos

---

*Desenvolvido para o canal Bruninho e Simões 🔴⚫*
