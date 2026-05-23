# 🚀 Deploy no Vercel - Guia Rápido

---

## 📋 Passo 1: Preparar Ambiente Local

```bash
# Dentro da pasta backend/
cp .env.example .env

# Edite .env e adicione sua DATABASE_URL do Supabase
# Supabase → Settings → Database → Connection String
```

Seu `.env` deve parecer assim:
```
NODE_ENV=development
DATABASE_URL=postgresql://postgres:xxxxx@db.apyibgjjllwugjzwdyat.supabase.co:5432/postgres
FRONTEND_URL=http://localhost:3000
PORT=3001
JWT_SECRET=sua_chave_aqui_com_minimo_32_caracteres
JWT_EXPIRES_IN=7d
```

---

## 📋 Passo 2: Testar Localmente

```bash
cd backend
npm install
npm run dev
```

Deve aparecer:
```
🚀 API Bruninho e Simões rodando na porta 3001
```

Se conectou ao Supabase = ✅ Pronto!

---

## 📋 Passo 3: Git Push

```bash
# Na raiz do projeto
git add .
git commit -m "Deploy ready"
git push origin main
```

---

## 📋 Passo 4: Vercel - Configurar Variáveis

### Acesse seu projeto no Vercel:
```
https://vercel.com/seu-username/seu-projeto
```

### Clique em "Settings" → "Environment Variables"

### Adicione EXATAMENTE essas 4 variáveis:

```
KEY                 VALUE
─────────────────────────────────────────────────────────
NODE_ENV            production

DATABASE_URL        postgresql://postgres:xxxxx@db.apyibgjjllwugjzwdyat.supabase.co:5432/postgres
                    (MESMA do .env local)

FRONTEND_URL        https://seu-frontend.vercel.app
                    (Vercel vai gerar automaticamente)

JWT_SECRET          sua_chave_super_secreta_com_minimo_32_caracteres
                    (use a mesma do .env local)
```

⚠️ **Importantes:**
- `DATABASE_URL` deve ser **exatamente igual** ao do seu .env local
- `FRONTEND_URL` será a URL que Vercel gerar
- Salve CTRL+S depois de adicionar cada variável

---

## 📋 Passo 5: Deploy

### Opção A: Deploy automático (recomendado)
```bash
git push origin main
# Vercel detecta e faz deploy automático
```

### Opção B: Deploy manual no Vercel
```
Dashboard → Deployments → Deploy
```

---

## ✅ Verificar se Funcionou

### Backend está online:
```bash
curl https://seu-projeto.vercel.app/api/players
```

Deve retornar:
```json
[]
```

Se retornar um array vazio = ✅ **FUNCIONANDO!**

---

## 📋 Próximos Passos

1. ✅ Backend rodando em Vercel
2. → Configurar Frontend (Next.js)
3. → Testar formulário de adicionar notas
4. → Compartilhar URL com outro usuário

---

## 🔐 Segurança - Não Esqueça!

- ✅ `.env` está em `.gitignore` (não será commitado)
- ✅ Variáveis sensíveis estão em Vercel (protegidas)
- ✅ Banco está em Supabase (seguro)

---

## 🆘 Problemas?

### "Build failed"
```
Vercel → Deployments → Error → Verificar mensagem
```

### "Cannot connect to database"
```
1. Verificar DATABASE_URL em Vercel
2. Verificar se está copiado corretamente
3. Copiar novamente do Supabase
```

### "API retorna erro 500"
```
1. Verificar logs em Vercel (Deployments → Logs)
2. Verificar DATABASE_URL
3. Verificar conexão com Supabase
```

---

**Pronto! Seu backend está em produção! 🚀**
