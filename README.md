# 🎓 Estudaí — Frontend (React.js)

> Plataforma web para conexão entre alunos e veteranos universitários, desenvolvida em **React.js**, com autenticação JWT e integração ao backend Flask.  
> Parte do **Projeto 3 — Programação Eficaz - Insper - Segundo Período**.

---

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5.0.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask%20API-Backend-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-4DB33D?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

---

## 🧠 Sobre o Projeto

O **Estudaí (Frontend)** é a interface web que conecta **veteranos, monitores e ex-alunos** a **alunos universitários** em busca de reforço acadêmico ou aulas particulares.  
Desenvolvido com **React.js (Vite)**, o sistema consome uma **API RESTful em Flask**, oferecendo uma experiência fluida, moderna e segura.

---

## 🚀 Funcionalidades Principais

✅ Cadastro e login de alunos e professores  
✅ Painéis personalizados (Aluno e Professor)  
✅ Agendamento de aulas com verificação de horários  
✅ Listagem e filtragem de professores  
✅ Chat em tempo real entre aluno e professor  
✅ Avaliações e notas de aulas  
✅ Proteção de rotas com autenticação JWT  
✅ Layout moderno e responsivo  

---

## 🧩 Tecnologias Utilizadas — Frontend

| Categoria | Tecnologias / Ferramentas | Descrição |
|------------|----------------------------|------------|
| **Linguagem Principal** | JavaScript (ES6+) | Base do desenvolvimento React |
| **Framework / Build Tool** | React.js (com Vite) | Framework principal da interface e empacotador rápido |
| **Gerenciamento de Rotas** | React Router DOM | Controle de navegação entre páginas |
| **HTTP Client** | Axios | Consumo da API Flask (requisições REST) |
| **Gerenciamento de Estado** | React Hooks / Context API | Controle de estado global e local dos componentes |
| **Estilização** | CSS / CSS Modules | Estilos modulares, tema claro/escuro e responsividade |
| **Componentização** | JSX / Componentes funcionais | Interface dinâmica e reutilizável |
| **Autenticação** | JWT (via authService.js) | Proteção de rotas e controle de sessão |
| **Integração com Backend** | API Flask RESTful | Comunicação com servidor Python |
| **Empacotamento / Build** | Vite | Build rápido e leve para produção |
| **Controle de Versão** | Git e GitHub | Versionamento colaborativo |
| **Padrões de Código** | ESLint | Padronização de sintaxe e boas práticas |
| **Gerenciamento de Dependências** | npm | Instalação e manutenção de pacotes |
| **Ambiente de Desenvolvimento** | Node.js | Execução e build do projeto React |
| **Ferramentas de Teste** | Vitest / Manual Testing | Testes de fluxo e usabilidade |
| **Assets / Ícones** | React Icons / Assets Customizados | Ícones, imagens e recursos gráficos |

---

## 🏗️ Estrutura do Projeto

```bash
notes-frontend/
│
├── public/                        # Arquivos estáticos
│
├── src/
│   ├── assets/                    # Ícones, imagens e mídias
│   │
│   ├── components/                # Componentes reutilizáveis
│   │   ├── agendar-aula/
│   │   ├── card-aulas/
│   │   ├── card-disciplinas/
│   │   ├── cta-share/
│   │   ├── footer/
│   │   ├── header-deslogado/
│   │   ├── header-logado/
│   │   ├── perfil-aluno/
│   │   ├── perfil-professor/
│   │   ├── professores-grid/
│   │   ├── review-card/
│   │   ├── topic-card/
│   │   ├── topics-carousel/
│   │   └── ProtectedRoute.jsx
│   │
│   ├── pages/                     # Páginas completas da aplicação
│   │   ├── cadastro/
│   │   ├── chats/
│   │   ├── dashboard-aluno/
│   │   ├── dashboard-professor/
│   │   ├── home/
│   │   ├── home-professor/
│   │   ├── junte-se-nos/
│   │   ├── lista-professores/
│   │   ├── login/
│   │   └── perfil-publico/
│   │
│   ├── services/                  # Comunicação com backend Flask
│   │   ├── apiService.js          # Configuração base (Axios)
│   │   ├── authService.js         # Login e verificação de token
│   │   ├── chatService.js         # Comunicação e histórico de mensagens
│   │   └── userService.js         # CRUD de usuários (aluno/professor)
│   │
│   ├── App.jsx                    # Estrutura principal do app
│   ├── App.css                    # Estilos gerais
│   ├── index.css                  # Reset e estilos globais
│   └── main.jsx                   # Ponto de entrada do React
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```
## 📄 Acesso ao documento do projeto
https://docs.google.com/document/d/1C1V_qLk0f_oySNz3rmSsapQO2a3BLTWCD8VKug_Kxy8/edit?usp=sharing

## 👨‍💻 Equipe de Desenvolvimento

| Nome |
|------|
| Gabriel Rosa | 
| João Pedro Vivaqua |
| João Pedro Murbach |
| Lucas Bressanin |
| Murilo Godoy |
| Vinicius Oehlmann |
| Victor Pimenta |

## Link do Site
http://54.196.232.66



