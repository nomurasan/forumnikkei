# ==========================================
# Estágio de Compilação (Build Stage)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de definição de pacotes
COPY package*.json ./

# Instala todas as dependências (incluindo as de desenvolvimento)
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Compila a aplicação (Vite frontend + esbuild do backend Express)
RUN npm run build

# ==========================================
# Estágio de Execução (Runner Stage)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Define o ambiente de execução como produção
ENV NODE_ENV=production

# Copia arquivos de pacotes para o runner
COPY package*.json ./

# Instala apenas as dependências de produção para manter a imagem leve
RUN npm install --omit=dev

# Copia os arquivos compilados do estágio anterior
COPY --from=builder /app/dist ./dist

# Garante que o diretório de dados persistentes exista com permissões adequadas
RUN mkdir -p /app/data && chown -R node:node /app

# Altera para um usuário não-root por questões de segurança
USER node

# Expõe a porta interna da aplicação (Express)
EXPOSE 3000

# Volume para persistência física das respostas coletadas no formulário
VOLUME ["/app/data"]

# Comando para iniciar a aplicação
CMD ["npm", "start"]
