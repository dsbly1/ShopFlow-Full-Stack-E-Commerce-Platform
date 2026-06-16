# ShopFlow — Full-Stack E-Commerce Platform

![CI](https://github.com/dsbly1/ShopFlow-Full-Stack-E-Commerce-Platform/actions/workflows/ci.yml/badge.svg)

A production-grade marketplace built with Node.js, PostgreSQL, and vanilla HTML/CSS/JS — deployed on Vercel.

## Live Demo

- **Frontend:** https://shopflow-client.vercel.app
- **API Health:** https://shopflow-client.vercel.app/api/health

## Screenshots

![Homepage](public/screenshots/homepage.png)
![Register](public/screenshots/register.png)
![Dashboard](public/screenshots/dashboard.png)
![Seller Registration](public/screenshots/seller.png)

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** PostgreSQL
- **Auth:** JWT (JSON Web Tokens)
- **Email:** Resend API
- **Testing:** Jest, Supertest
- **Deployment:** Vercel (frontend + backend), Render (PostgreSQL)

## Features

- JWT authentication with email verification and role-based access (buyer / seller / admin)
- Seller onboarding with 4-step registration, product management, payout tracking, and 1099 tax tools
- Normalized PostgreSQL schema — 7 tables, 6 indexes, a place_order() stored procedure for atomic order placement
- RESTful API with 15+ endpoints across auth, products, cart, orders, reviews, categories, sellers, and admin
- Real-time order status tracking via Socket.io — live badge updates and toast notifications
- Shopping cart, checkout, order history, and real-time inventory decrement
- Buyer reviews and aggregate star ratings
- AES-256 encrypted banking information storage
- Seller profile pages with avatar generation
- Admin dashboard for user and product moderation
- Responsive mobile-first UI
- API test suite with Jest + Supertest (5 passing tests, CI via GitHub Actions)

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm

### Installation

    git clone https://github.com/dsbly1/ShopFlow-Full-Stack-E-Commerce-Platform.git
    cd ShopFlow-Full-Stack-E-Commerce-Platform
    npm install

### Environment Variables

Create a .env file in the root directory:

    DATABASE_URL=postgresql://username:password@localhost:5432/shopflow
    PORT=3000
    NODE_ENV=development
    JWT_SECRET=your_jwt_secret_here
    JWT_EXPIRES_IN=7d
    CLIENT_URL=http://localhost:5500
    RESEND_API_KEY=your_resend_api_key

### Database Setup

    psql -U postgres -c "CREATE DATABASE shopflow;"
    npm run db:migrate
    npm run db:seed

### Running Locally

    npm start

    # or for development with auto-reload
    npm run dev

Open client/index.html in your browser or use Live Server on port 5500.

### Running Tests

    npm test

    # With coverage report
    npm run test:coverage

## API Endpoints

| Method | Endpoint                  | Description             |
|--------|---------------------------|-------------------------|
| POST   | /api/auth/register        | Register a new user     |
| POST   | /api/auth/login           | Login and receive JWT   |
| GET    | /api/products             | List all products       |
| GET    | /api/products/:id         | Get product detail      |
| POST   | /api/cart                 | Add item to cart        |
| POST   | /api/orders               | Place an order          |
| PATCH  | /api/orders/:id/status    | Update order status (emits real-time event) |
| GET    | /api/reviews/:product_id  | Get product reviews     |
| GET    | /api/categories           | List all categories     |
| GET    | /api/sellers/:id          | Seller profile          |

## Deployment

The project is deployed as a unified full-stack app on Vercel using vercel.json to route /api/* to the Express backend and serve the client/ folder as static files.

    npx vercel --prod

Set environment variables in your Vercel project dashboard before deploying.

## Project Structure

    ShopFlow/
    ├── client/           # Frontend HTML/CSS/JS
    │   ├── index.html
    │   ├── css/
    │   ├── js/
    │   └── pages/
    ├── server/           # Express backend
    │   ├── index.js
    │   ├── routes/
    │   ├── middleware/
    │   └── __tests__/    # Jest + Supertest test suite
    ├── .github/
    │   └── workflows/
    │       └── ci.yml    # GitHub Actions CI pipeline
    ├── database/         # SQL schema and seeds
    ├── public/           # Static assets and screenshots
    ├── vercel.json       # Vercel deployment config
    └── package.json

## Author

**Damon Bly Jr.** — Full-Stack Developer, Kansas City, MO
- GitHub: [@dsbly1](https://github.com/dsbly1)
- Live Project: https://shopflow-client.vercel.app

## What I Learned

- Designing atomic DB transactions with PostgreSQL stored procedures
- Implementing AES-256 encryption for sensitive financial data at rest
- Building multi-step seller onboarding with role-based dashboards
- Structuring a RESTful API across 15+ endpoints with JWT middleware
- Integrating Socket.io for real-time WebSocket communication
- Writing API tests with Jest + Supertest and automating CI with GitHub Actions
- Deploying a unified full-stack app on Vercel with custom routing via vercel.json

## License

MIT