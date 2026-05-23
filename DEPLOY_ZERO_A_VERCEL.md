# 🚀 Deploy ZERO → VERCEL (Passo a Passo)

## ✅ Seu DATABASE_URL está CORRETO!

```
postgresql://postgres.apyibgjjllwugjzwdyat:BruninhoESimoes@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
```

**Por que diferente do render?**
- `6543` = Connection Pooler do Supabase (melhor para serverless como Vercel)
- `5432` = Conexão direta (melhor para servidores normais)
- Ambos funcionam, mas pooler é melhor para Vercel ✅

---

## 📋 PASSO 1: Testar Local (5 min)

```bash
# 1. Entre na pasta backend
cd backend

# 2. Copie o arquivo .env
cp .env.example .env

# 3. Verifique se .env tem:
NODE_ENV=development
DATABASE_URL=postgresql://postgres.apyibgjjllwugjzwdyat:BruninhoESimoes@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
FRONTEND_URL=http://localhost:3000
PORT=3001
JWT_SECRET=sua_chave_aqui_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# 4. Instale dependências
npm install

# 5. Rode o servidor
npm run dev
```

**Resultado esperado:**
```
🚀 API Bruninho e Simões rodando na porta 3001
```

Se apareceu = ✅ **Local funcionando!**

---

## 📋 PASSO 2: Git e GitHub (2 min)

```bash
# 1. Na RAIZ do projeto (não em backend)
git init
git add .
git commit -m "Initial commit"

# 2. Crie um repositório no GitHub (https://github.com/new)
# Sem README, sem .gitignore (já temos)

# 3. Adicione o remote
git remote add origin https://github.com/SEU_USERNAME/bruninhoesimoes.git

# 4. Faça push
git branch -M main
git push -u origin main
```

**Resultado:**
- Seu código está no GitHub ✅
- URL: `https://github.com/SEU_USERNAME/bruninhoesimoes`

---

## 📋 PASSO 3: Deploy Frontend no Vercel (3 min)

### 3a. Abra Vercel

```
https://vercel.com/new
```

Escolha: **Import Git Repository**

### 3b. Conecte GitHub

1. Clique **Select GitHub Account**
2. Autorize Vercel acessar seu GitHub
3. Selecione: `bruninhoesimoes`

### 3c. Configure Projeto

Na tela "Configure project":

```
Project Name:  bruninhoesimoes
Framework:     Next.js
Root Directory: ./frontend  ← IMPORTANTE!
```

### 3d. Environment Variables

Clique: **Add Environment Variable**

```
Nome:  NEXT_PUBLIC_API_URL
Valor: https://seu-backend.vercel.app
```

⚠️ **Não sabe URL do backend ainda?** Deixe para depois, configure agora:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Depois muda para a URL do backend.

### 3e. Deploy

Clique: **Deploy**

⏳ Espera 2-3 minutos...

**Resultado:**
```
✅ Deployment successful
Seu frontend está em: https://bruninhoesimoes.vercel.app
```

---

## 📋 PASSO 4: Deploy Backend no Vercel (3 min)

### 4a. Vercel Dashboard

```
https://vercel.com/dashboard
```

Clique: **Add New...** → **Project**

### 4b. Import Git Repo

1. **Import Git Repository**
2. Selecione: `bruninhoesimoes`

### 4c. Configure Projeto

Na tela "Configure project":

```
Project Name:  bruninhoesimoes-backend
Framework:     Other
Root Directory: ./backend  ← IMPORTANTE!
```

### 4d. Environment Variables

Clique: **Add Environment Variable** para cada uma:

```
╔════════════════════════════════════════════════════════════╗
║ NAME              VALUE                                    ║
╠════════════════════════════════════════════════════════════╣
║ NODE_ENV          production                               ║
╠════════════════════════════════════════════════════════════╣
║ DATABASE_URL      postgresql://postgres.apyibgjjllwu...  ║
║                   (EXATA do seu .env local)                ║
╠════════════════════════════════════════════════════════════╣
║ FRONTEND_URL      https://bruninhoesimoes.vercel.app      ║
║                   (URL do frontend que criou no passo 3)   ║
╠════════════════════════════════════════════════════════════╣
║ JWT_SECRET        sua_chave_super_secreta_com_32_chars    ║
║                   (mesma do .env local)                    ║
╠════════════════════════════════════════════════════════════╣
║ JWT_EXPIRES_IN    7d                                       ║
╠════════════════════════════════════════════════════════════╣
║ BCRYPT_ROUNDS     10                                       ║
╚════════════════════════════════════════════════════════════╝
```

### 4e. Deploy

Clique: **Deploy**

⏳ Espera 2-3 minutos...

**Resultado:**
```
✅ Deployment successful
Seu backend está em: https://bruninhoesimoes-backend.vercel.app
```

---

## 📋 PASSO 5: Conectar Frontend ↔ Backend (1 min)

### 5a. Volte ao Frontend no Vercel

```
https://vercel.com/seu-username/bruninhoesimoes
```

### 5b. Environment Variables

Clique: **Settings** → **Environment Variables**

### 5c. Edite NEXT_PUBLIC_API_URL

```
Antes:  NEXT_PUBLIC_API_URL = http://localhost:3001
Depois: NEXT_PUBLIC_API_URL = https://bruninhoesimoes-backend.vercel.app
```

### 5d. Redeploy Frontend

Clique: **Deployments** → clique no último deploy → **Redeploy**

Espera 1 minuto...

---

## ✅ Verificar se Funcionou

### 1. Backend está respondendo?

```bash
curl https://bruninhoesimoes-backend.vercel.app/api/players
```

Deve retornar:
```json
[]
```

Se retornou = ✅ **Backend OK!**

### 2. Frontend carrega?

```
https://bruninhoesimoes.vercel.app
```

Se abre a página = ✅ **Frontend OK!**

### 3. Testar formulário

1. Acesse o frontend
2. Vá em "Adicionar Notas"
3. Preencha os dados
4. Clique "Salvar"

Se salvou = ✅ **TUDO FUNCIONANDO!**

---

## 🎯 URLs Finais (Compartilhe com amigos)

```
Frontend: https://bruninhoesimoes.vercel.app
```

Pronto! Qualquer um acessa esse link e pode adicionar notas! 🎉

---

## 🔄 Se Precisar Fazer Mudanças no Código

```bash
# 1. Edite o código localmente
# ... faz as mudanças ...

# 2. Commit e push
git add .
git commit -m "Descrição da mudança"
git push origin main

# 3. Vercel detecta e faz deploy automático ✅
```

---

## 🆘 Problemas?

### Backend diz "Cannot connect to database"

```
1. Verificar DATABASE_URL em Vercel (Settings → Environment Variables)
2. Copiar novamente de Supabase → Settings → Database
3. Usar o "Connection Pooler" (6543), não o "Direct" (5432)
4. Clicar "Redeploy" no Vercel
```

### Frontend não conecta no backend

```
1. Verificar NEXT_PUBLIC_API_URL no frontend (Settings → Environment Variables)
2. Deve ser exatamente: https://bruninhoesimoes-backend.vercel.app
3. Redeploy frontend
```

### Erro 500 no backend

```
Vercel Dashboard → seu-backend → Deployments → ver Logs
Procurar por erro
```

---

## 🎉 Resumo Final

| Item | Local | Vercel |
|------|-------|--------|
| Frontend | localhost:3000 | https://bruninhoesimoes.vercel.app |
| Backend | localhost:3001 | https://bruninhoesimoes-backend.vercel.app |
| Banco | Supabase | Supabase |
| Custo | R$ 0 | R$ 0 |

✅ **Projeto no ar!**
