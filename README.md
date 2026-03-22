# NossaGrana

Aplicacao web para gestao financeira compartilhada entre duas pessoas. O sistema oferece controle de despesas, organizacao por categorias, analise mensal e comparativos entre parceiros.

## Visao geral

O projeto e dividido em duas aplicacoes:

- `backend`: API REST em Java/Spring Boot responsavel por autenticacao, regras de negocio e persistencia.
- `frontend`: interface web em React/TypeScript para operacao diaria da plataforma.

## Funcionalidades

- Cadastro e autenticacao com JWT
- Verificacao de email por codigo
- Recuperacao de senha por codigo
- Vinculo entre parceiros via convite por email
- Cadastro, edicao e exclusao de despesas
- Controle de orcamento por categoria
- Relatorios de gastos por categoria e por periodo
- Tema claro/escuro

## Stack tecnica

### Backend

- Java 21
- Spring Boot 3
- Spring Security
- JWT (JJWT)
- Spring Data JPA + Hibernate
- PostgreSQL
- Integracao de email transacional com Brevo

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Axios

## Pre-requisitos

- Java 21+
- Node.js 18+
- PostgreSQL 15+
- Conta Brevo para envio de emails

## Configuracao

### 1. Banco de dados

Crie o banco no PostgreSQL:

```sql
CREATE DATABASE nossagrana;
```

### 2. Backend

A configuracao sensivel deve ser fornecida por variaveis de ambiente ou arquivo local de profile.

Arquivo opcional para ambiente de desenvolvimento:

`backend/src/main/resources/application-dev.yaml`

Exemplo:

```yaml
jwt:
  secret: SUA_SECRET_JWT_AQUI_MINIMO_32_CARACTERES

brevo:
  api-key: SUA_CHAVE_API_BREVO_AQUI
```

Alternativamente, defina as variaveis no sistema:

```bash
export JWT_SECRET=sua_secret_aqui
export BREVO_API_KEY=sua_chave_brevo_aqui
```

Variaveis suportadas:

| Variavel | Padrao | Descricao |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/nossagrana` | URL de conexao com o banco |
| `DB_USERNAME` | `postgres` | Usuario do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `JWT_SECRET` | obrigatorio | Chave para assinatura dos tokens JWT (minimo 32 caracteres) |
| `BREVO_API_KEY` | obrigatorio | Chave da API Brevo |
| `FRONTEND_URL` | `http://localhost:5173` | URL utilizada nos links enviados por email |
| `PORT` | `8080` | Porta HTTP da API |

### 3. Frontend

Copie o arquivo de ambiente:

```bash
cp frontend/.env.example frontend/.env
```

Valor padrao:

```env
VITE_API_URL=http://localhost:8080/api
```

## Execucao local

### Backend

```bash
cd backend

# Com profile dev (usa application-dev.yaml)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Ou somente com variaveis de ambiente
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesso local: `http://localhost:5173`

## Estrutura do repositorio

```text
NossaGrana/
|-- backend/
|   `-- src/main/java/com/nossagrana/backend/
|       |-- controller/
|       |-- service/
|       |-- entity/
|       |-- dto/
|       |-- repository/
|       |-- security/
|       `-- exception/
`-- frontend/
    `-- src/
        |-- api/
        |-- components/
        |-- pages/
        |-- types/
        `-- hooks/
```

## API principal

### Autenticacao (publico)

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | `/api/auth/register` | Cadastro e envio de codigo de verificacao |
| POST | `/api/auth/login` | Login com email verificado |
| POST | `/api/auth/refresh` | Renovacao de access token |
| POST | `/api/auth/verificar-email` | Confirmacao de email por codigo |
| POST | `/api/auth/reenviar-verificacao` | Reenvio de codigo de verificacao |
| POST | `/api/auth/solicitar-reset-senha` | Solicitacao de reset de senha |
| POST | `/api/auth/reset-senha` | Redefinicao de senha por codigo |

### Endpoints autenticados

Requer header `Authorization: Bearer {token}`.

- `/api/casal/{id}/**`
- `/api/convites/**`
- `/api/despesas/**`
- `/api/categorias/**`
- `/api/relatorios/**`

## Seguranca

- Hash de senha com BCrypt
- Tokens JWT com renovacao por refresh token
- Validacao de autorizacao por escopo de casal
- Bloqueio de login para email nao verificado
- Expiracao de codigos de verificacao e recuperacao
- Segredos carregados por variaveis de ambiente

## Licenca

MIT
