# NossaGrana 💰

Aplicação web para casais gerenciarem suas finanças juntos. Controle de despesas, categorias com orçamento, relatórios mensais e comparação entre parceiros.

## Funcionalidades

- **Cadastro e autenticação** com JWT e verificação de email por código
- **Recuperação de senha** via código enviado por email
- **Sistema de casal** — parceiro 1 convida parceiro 2 por email
- **Despesas** com categorias, tipo, método de pagamento e histórico de edições
- **Orçamento por categoria** com alertas de estouro (verde / amarelo / vermelho)
- **Relatórios** — gastos por categoria, evolução mensal e comparação entre parceiros
- **Modo escuro/claro**

## Tecnologias

**Backend**
- Java 21 + Spring Boot 3
- Spring Security + JWT (JJWT)
- PostgreSQL + Spring Data JPA / Hibernate
- Envio de emails via [Brevo](https://brevo.com) (API transacional)

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router v6
- Axios com refresh token automático

## Pré-requisitos

- Java 21+
- Node.js 18+
- PostgreSQL 15+
- Conta no [Brevo](https://brevo.com) para envio de emails (plano gratuito é suficiente)

## Configuração

### 1. Banco de dados

Crie o banco no PostgreSQL:

```sql
CREATE DATABASE nossagrana;
```

### 2. Backend — variáveis de ambiente

O backend lê toda a configuração sensível via variáveis de ambiente. Crie o arquivo `backend/src/main/resources/application-dev.yaml` (já está no `.gitignore`):

```yaml
jwt:
  secret: SUA_SECRET_JWT_AQUI_MINIMO_32_CARACTERES

brevo:
  api-key: SUA_CHAVE_API_BREVO_AQUI
```

Ou exporte as variáveis antes de rodar:

```bash
export JWT_SECRET=sua_secret_aqui
export BREVO_API_KEY=sua_chave_brevo_aqui
```

Variáveis disponíveis:

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/nossagrana` | URL do banco |
| `DB_USERNAME` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `JWT_SECRET` | *(obrigatório)* | Secret para assinar tokens JWT (mín. 32 chars) |
| `BREVO_API_KEY` | *(obrigatório)* | Chave da API do Brevo |
| `FRONTEND_URL` | `http://localhost:5173` | URL do frontend (usado nos links dos emails) |
| `PORT` | `8080` | Porta do servidor |

### 3. Frontend — variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp frontend/.env.example frontend/.env
```

Edite `frontend/.env` se necessário:

```env
VITE_API_URL=http://localhost:8080/api
```

## Rodando localmente

### Backend

```bash
cd backend

# Com profile dev (lê application-dev.yaml)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Ou com variáveis de ambiente exportadas
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

## Estrutura do projeto

```
NossaGrana/
├── backend/
│   └── src/main/java/com/nossagrana/backend/
│       ├── controller/     # Endpoints REST
│       ├── service/        # Lógica de negócio
│       ├── entity/         # Entidades JPA
│       ├── dto/            # Objetos de transferência
│       ├── repository/     # Interfaces JPA
│       ├── security/       # JWT, filtros, Spring Security
│       └── exception/      # Tratamento de erros
└── frontend/
    └── src/
        ├── api/            # Clientes HTTP (Axios)
        ├── components/     # Componentes reutilizáveis
        ├── pages/          # Páginas da aplicação
        ├── types/          # Tipos TypeScript
        └── hooks/          # Hooks customizados
```

## API — principais endpoints

### Autenticação (público)
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro (retorna userId, envia email de verificação) |
| POST | `/api/auth/login` | Login (requer email verificado) |
| POST | `/api/auth/refresh` | Renovar access token |
| POST | `/api/auth/verificar-email` | Verificar email com código |
| POST | `/api/auth/reenviar-verificacao` | Reenviar código de verificação |
| POST | `/api/auth/solicitar-reset-senha` | Solicitar reset de senha |
| POST | `/api/auth/reset-senha` | Redefinir senha com código |

### Demais endpoints (requer `Authorization: Bearer {token}`)
- `/api/casal/{id}/**` — dados e configurações do casal
- `/api/convites/**` — criar e aceitar convites
- `/api/despesas/**` — gerenciar despesas
- `/api/categorias/**` — gerenciar categorias
- `/api/relatorios/**` — relatórios e estatísticas

## Segurança

- Senhas armazenadas com BCrypt
- Autenticação via JWT (access token 1h + refresh token 30 dias)
- Todos os endpoints protegidos validam o JWT — identidade nunca vem de headers manipuláveis
- Verificação de posse: usuário só acessa dados do próprio casal
- Email verificado obrigatório para login
- Códigos de verificação/reset com expiração (24h e 15 min respectivamente)
- Configuração sensível via variáveis de ambiente, nunca hardcoded

## Licença

MIT
