FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar dependências primeiro (cache layer)
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --omit=dev

# Copiar restante do código
COPY . .

# Porta exposta
EXPOSE 3001

# Variável de ambiente padrão
ENV NODE_ENV=production

# Iniciar aplicação
CMD ["node", "src/server.js"]
