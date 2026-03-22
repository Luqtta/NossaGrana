# NossaGrana

Aplicação web para casais gerenciarem suas finanças em conjunto. Permite controle de despesas, categorias com orçamento, relatórios mensais e comparação entre parceiros.

## Funcionalidades

- Cadastro e autenticação com JWT e verificação de email por código
- Recuperação de senha via código enviado por email
- Sistema de casal — parceiro 1 convida parceiro 2 por email
- Despesas com categorias, tipo, método de pagamento e histórico de edições
- Orçamento por categoria com alertas de limite (verde, amarelo, vermelho)
- Relatórios com gastos por categoria, evolução mensal e comparação entre parceiros
- Modo claro e escuro

## Tecnologias

### Backend
- Java 21
- Spring Boot 3
- Spring Security com JWT (JJWT)
- PostgreSQL
- Spring Data JPA / Hibernate
- Envio de emails via Brevo (API transacional)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Axios com refresh token automático

## Pré-requisitos

- Java 21 ou superior
- Node.js 18 ou superior
- PostgreSQL 15 ou superior
- Conta no Brevo para envio de emails

## Configuração

### 1. Banco de dados

Crie o banco no PostgreSQL:

```sql
CREATE DATABASE nossagrana;
