# Client Lister

![Logo](src/assets/icon.ico)

> **Aplicativo moderno para listar e gerenciar clientes IPTV**

---

## 🚀 Funcionalidades
- Listagem e gerenciamento de clientes
- Suporte a múltiplos idiomas (pasta `src/translations`)
- Atualização automática
- Notificações
- Atalhos personalizados
- Instalação fácil (NSIS)

---

## 📁 Estrutura de Pastas
```
├── src
│   ├── main         # Código principal (Electron)
│   ├── renderer     # Código de renderização
│   ├── styles       # CSS
│   ├── assets       # Imagens, ícones, etc
│   ├── translations # Arquivos de tradução
│   ├── utils        # Utilitários JS
│   └── installer    # Instalador customizado
├── public           # HTML principal
├── scripts          # Scripts de build e organização
├── data             # Dados, combos, hits
├── dist             # Saída do build
├── node_modules     # Dependências
├── .gitignore       # Ignora arquivos desnecessários
├── package.json     # Configuração do projeto
├── organize.js      # Script para organizar a estrutura
└── README.md        # Este arquivo
```

---

## 🛠️ Como rodar localmente
```bash
# Instale as dependências
npm install

# Organize a estrutura (opcional, mas recomendado)
npm run organize

# Rode o app em modo dev
yarn start # ou npm start
```

---

## 🏗️ Como gerar o instalador (build)
```bash
# Gera o instalador para Windows
npm run build

# O instalador estará em /dist
```

---

## ☁️ Como subir para o GitHub (deploy)
1. Crie um repositório no GitHub
2. No terminal, rode:
```bash
git init
git add .
git commit -m "Primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```
3. Pronto! Seu projeto estará online.

---

## 💡 Dicas
- Sempre rode `npm run organize` após adicionar arquivos soltos.
- Para adicionar traduções, coloque arquivos em `src/translations`.
- O build do Electron está configurado para Windows, mas pode ser adaptado para Mac/Linux.

---

## 📃 Licença
MIT

---

Feito com 💙 por [Seu Nome] 