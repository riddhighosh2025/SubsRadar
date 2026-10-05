# 📡 SubsRadar

### Smart Subscription & Expense Management Platform

**SubsRadar** is a full-stack web application designed to help users discover, organize, monitor, and analyze their recurring subscriptions and expenses from a single platform.

The application combines **subscription management, expense analytics, renewal tracking, AI-powered insights, financial statement analysis, and cancellation assistance** to help users understand their recurring financial commitments and make better spending decisions.

> **A project focused on building an intelligent subscription and expense management solution using modern web technologies and AI.**

🌐 **Live Application:** [SubsRadar](https://subs-radar-gamma.vercel.app/)

📂 **GitHub Repository:** [SubsRadar](https://github.com/riddhighosh2025/SubsRadar)

---

# 📑 Table of Contents

* [About the Project](#-about-the-project)
* [Problem Statement](#-problem-statement)
* [Our Solution](#-our-solution)
* [Objectives](#-objectives)
* [Key Features](#-key-features)
* [AI-Powered Intelligence](#-ai-powered-intelligence)
* [Subscription Management](#-subscription-management)
* [Expense Analytics](#-expense-analytics)
* [Renewal Tracking](#-renewal-tracking)
* [Financial Statement Analysis](#-financial-statement-analysis)
* [Cancellation Assistance](#-cancellation-assistance)
* [Authentication & Security](#-authentication--security)
* [Technology Stack](#-technology-stack)
* [System Architecture](#-system-architecture)
* [Project Structure](#-project-structure)
* [Application Workflow](#-application-workflow)
* [Getting Started](#-getting-started)
* [Environment Variables](#-environment-variables)
* [Available Scripts](#-available-scripts)
* [API Overview](#-api-overview)
* [Database](#-database)
* [AI Architecture](#-ai-architecture)
* [Deployment](#-deployment)
* [Security Considerations](#-security-considerations)
* [Future Enhancements](#-future-enhancements)
* [Team](#-team)
* [Contributing](#-contributing)
* [Project Status](#-project-status)
* [License](#-license)

---

# 🚀 About the Project

In today's digital environment, users often subscribe to multiple streaming platforms, productivity tools, cloud services, educational platforms, fitness applications, SaaS products, and other recurring services.

Managing all these subscriptions manually can become difficult.

Users may:

* Forget about active subscriptions.
* Miss upcoming renewal dates.
* Lose track of monthly recurring expenses.
* Pay for services they rarely use.
* Struggle to identify recurring payments in financial statements.
* Find cancellation processes inconvenient.
* Underestimate how much small recurring payments cost over an entire year.

**SubsRadar** was developed to address these challenges.

The platform provides a centralized environment where users can manage their subscriptions, analyze recurring expenses, monitor renewal dates, and receive AI-assisted recommendations.

---

# ❗ Problem Statement

The increasing number of subscription-based services has made recurring expenses harder to monitor.

A user may have subscriptions distributed across several platforms, each with different:

* Billing cycles
* Renewal dates
* Pricing
* Cancellation policies
* Usage patterns

As a result, users can unintentionally continue paying for services that they no longer need.

Traditional expense trackers may show transactions, but they often do not provide **subscription-specific intelligence**.

SubsRadar focuses specifically on recurring expenses and attempts to turn subscription data into **actionable insights**.

---

# 💡 Our Solution

SubsRadar brings subscription information into one centralized platform.

The system allows users to:

```text
Track Subscriptions
        ↓
Monitor Recurring Expenses
        ↓
Analyze Spending
        ↓
Track Renewal Dates
        ↓
Identify Potential Savings
        ↓
Receive AI-Assisted Insights
        ↓
Take Action
```

The platform combines traditional full-stack application development with AI capabilities to provide a smarter subscription-management experience.

---

# 🎯 Objectives

The major objectives of SubsRadar are:

1. **Centralize subscription information** in one platform.
2. **Track recurring expenses** across different billing cycles.
3. **Provide spending analytics** through visual dashboards.
4. **Monitor upcoming renewals** and important dates.
5. **Analyze financial statements** for recurring subscription charges.
6. **Use AI to generate personalized insights.**
7. **Assist users with subscription cancellation.**
8. **Provide secure authentication and protected APIs.**
9. **Support both cloud-based and locally hosted AI models.**
10. **Create an intuitive and responsive user experience.**

---

# ✨ Key Features

## 📊 1. Subscription Dashboard

The dashboard provides a centralized view of the user's recurring financial commitments.

Users can monitor:

* Active subscriptions
* Monthly expenses
* Estimated annual expenses
* Subscription categories
* Upcoming renewals
* Spending distribution
* Subscription-related insights

This allows users to understand their recurring expenses without manually checking multiple services.

---

## 💳 2. Subscription Management

Users can maintain important information about their subscriptions, such as:

* Subscription name
* Cost
* Billing frequency
* Category
* Renewal date
* Usage information
* Cancellation information

The system can normalize subscription costs to make monthly and yearly comparisons easier.

---

## 📅 3. Renewal Tracking

Renewal dates are an important part of subscription management.

SubsRadar provides renewal-related information such as:

* Upcoming renewal date
* Remaining time before renewal
* Billing frequency
* Suggested cancellation timing
* Renewal-related recommendations

This helps users avoid unexpected recurring charges.

---

# 📈 Expense Analytics

SubsRadar provides visual representations of recurring expenses to make financial information easier to understand.

The application uses **Recharts** for data visualization.

Analytics can help users understand:

* Monthly recurring spending
* Annualized subscription costs
* Category-wise spending
* Subscription distribution
* Spending patterns
* Relative cost of different subscriptions

Instead of looking at a long list of transactions, users can understand their spending through visual insights.

---

# 🤖 AI-Powered Intelligence

AI is one of the major components of SubsRadar.

The application integrates AI capabilities through:

* **Google Gemini**
* **Gemma**
* **Ollama**

This allows the platform to use both cloud-based and locally hosted AI functionality.

### AI can assist with:

* Subscription analysis
* Financial statement interpretation
* Subscription categorization
* Spending recommendations
* Cancellation communication
* Renewal-related guidance
* Personalized subscription insights

The project also supports a locally hosted Gemma model through Ollama, providing an alternative to relying entirely on external AI services.

---

# 🧾 Financial Statement Analysis

One of the important capabilities of SubsRadar is the analysis of financial statement-style information.

The system can process transaction information and attempt to identify recurring subscription payments.

The processing workflow can include:

```text
Financial Statement
        ↓
Transaction Extraction
        ↓
Merchant Identification
        ↓
Subscription Recognition
        ↓
Category Assignment
        ↓
Billing Cycle Estimation
        ↓
Expense Normalization
        ↓
Subscription Insights
```

This reduces the effort required to manually identify recurring subscription payments.

---

# ✉️ Cancellation Assistance

Subscription cancellation can sometimes be difficult because users may need to communicate with customer support or follow specific cancellation procedures.

SubsRadar provides AI-assisted cancellation support.

The system can generate cancellation communication based on information such as:

* Subscription name
* Subscription cost
* Billing cycle
* Renewal date
* Cancellation reason
* Preferred communication style

Possible communication styles include:

* **Polite & Brief**
* **Negotiate Discount**
* **Formal Cancellation Notice**

This helps users prepare appropriate cancellation requests.

---

# 🔐 Authentication & Security

SubsRadar includes server-side authentication and protected API functionality.

### Authentication Technologies

* JSON Web Tokens (JWT)
* bcrypt password hashing
* Bearer token authentication
* Protected API routes
* Environment variables for sensitive configuration

Passwords are hashed before being stored, rather than storing plaintext passwords.

JWT authentication is used to verify authenticated requests to protected endpoints.

### Security Principles

The project follows important security practices such as:

* Never storing plaintext passwords
* Keeping secrets outside source control
* Protecting private API endpoints
* Using environment variables for credentials
* Separating frontend and backend responsibilities

---

# 🛠️ Technology Stack

## 🎨 Frontend

| Technology   | Purpose                       |
| ------------ | ----------------------------- |
| React 19     | User interface                |
| TypeScript   | Type-safe development         |
| Vite         | Development and build tooling |
| Tailwind CSS | Styling                       |
| Lucide React | Icons                         |
| Recharts     | Data visualization            |
| Motion       | Animations                    |
| jsPDF        | PDF generation                |

---

## ⚙️ Backend

| Technology | Purpose                   |
| ---------- | ------------------------- |
| Node.js    | Runtime environment       |
| Express    | Backend server/API        |
| TypeScript | Server-side development   |
| JWT        | Authentication            |
| bcryptjs   | Password hashing          |
| dotenv     | Environment configuration |

---

## 🤖 AI / ML

| Technology       | Purpose                |
| ---------------- | ---------------------- |
| Google Gemini    | Cloud AI capabilities  |
| Gemma            | AI model               |
| Ollama           | Local AI model runtime |
| Google GenAI SDK | Gemini integration     |

---

## 🗄️ Database

| Technology   | Purpose                     |
| ------------ | --------------------------- |
| Prisma       | ORM/database access         |
| SQL Database | Persistent application data |

---

## ☁️ Deployment

| Technology | Purpose                |
| ---------- | ---------------------- |
| Vercel     | Application deployment |

---

# 🏗️ System Architecture

The overall system follows a full-stack architecture.

```text
                         ┌──────────────────────┐
                         │        USER          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │       React Frontend        │
                    │     TypeScript + Vite      │
                    │                             │
                    │ Dashboard / Analytics       │
                    │ Subscription Management     │
                    │ AI Features / UI            │
                    └──────────────┬──────────────┘
                                   │
                              HTTP / API
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │       Express Backend       │
                    │        TypeScript           │
                    │                             │
                    │ Authentication              │
                    │ Subscription Logic          │
                    │ Expense Processing           │
                    │ AI Integration               │
                    └───────┬──────────┬──────────┘
                            │          │
              ┌─────────────┘          └──────────────┐
              ▼                                       ▼
     ┌──────────────────┐                   ┌──────────────────┐
     │     Prisma /     │                   │    AI Services   │
     │     Database     │                   │                  │
     │                  │                   │ Gemini / Gemma   │
     │ User Data        │                   │ Ollama           │
     │ Subscriptions    │                   │                  │
     │ Expenses         │                   └──────────────────┘
     └──────────────────┘
```

---

# 📂 Project Structure

```text
SubsRadar/
│
├── prisma/
│   └── Prisma / database configuration
│
├── server/
│   └── Server-side functionality
│
├── src/
│   ├── Frontend application
│   ├── Components
│   ├── UI
│   ├── Subscription functionality
│   └── Application logic
│
├── .env.example
├── .gitignore
├── bun.lock
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
└── vite.config.ts
```

---

# 🔄 Application Workflow

### 1️⃣ User Registration / Login

The user creates an account or logs into the platform.

Authentication is handled by the backend using secure password hashing and JWT-based authentication.

### 2️⃣ Subscription Data

Subscription information is entered or processed through the supported workflows.

### 3️⃣ Backend Processing

The backend processes subscription information and determines relevant details such as:

* Cost
* Billing cycle
* Category
* Renewal date
* Recurring expenditure

### 4️⃣ Database Storage

Relevant application data is persisted through the Prisma/database layer.

### 5️⃣ Dashboard Visualization

The frontend retrieves the processed information and presents it through dashboards and charts.

### 6️⃣ AI Analysis

AI services can analyze subscription information and provide additional insights or generate cancellation communication.

### 7️⃣ User Action

Users can use these insights to:

* Monitor spending
* Review subscriptions
* Prepare cancellations
* Plan upcoming expenses
* Identify potential savings

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* [Node.js](https://nodejs.org/)
* [Bun](https://bun.sh/)
* Git
* A configured database
* Optional: Ollama for local Gemma functionality
* Optional: Gemini API key for Gemini-powered functionality

---

## 1. Clone the Repository

```bash
git clone https://github.com/riddhighosh2025/SubsRadar.git

cd SubsRadar
```

---

## 2. Install Dependencies

The repository contains a `bun.lock` file, so Bun can be used to install dependencies.

```bash
bun install
```

---

## 3. Configure Environment Variables

Create a `.env` file using the example configuration:

```bash
cp .env.example .env
```

Configure the required environment variables.

Example:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secure_jwt_secret
GEMINI_API_KEY=your_gemini_api_key

OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=gemma4:e4b
```

> ⚠️ Never commit `.env` files, API keys, database credentials, or JWT secrets to GitHub.

---

## 4. Generate Prisma Client

```bash
bunx prisma generate
```

Run database migrations if required:

```bash
bunx prisma migrate dev
```

---

## 5. Start the Development Server

```bash
bun run dev
```

The application can then be accessed through the local URL displayed in the terminal.

---

# 📜 Available Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `bun run dev`     | Starts the development server         |
| `bun run start`   | Starts the application                |
| `bun run build`   | Builds the application for production |
| `bun run preview` | Previews the production build         |
| `bun run lint`    | Runs TypeScript/lint checks           |

---

# 🔌 API Overview

The backend provides API functionality for different parts of the application.

Authentication includes endpoints such as:

```text
POST /api/auth/register
```

Protected API requests use:

```text
Authorization: Bearer <JWT_TOKEN>
```

The backend contains functionality related to:

* Authentication
* User management
* Subscription management
* Expense processing
* Statement analysis
* AI-powered analysis
* Cancellation assistance
* Renewal analysis

---

# 🗄️ Database Layer

SubsRadar uses Prisma as the database access layer.

The database layer is responsible for persistent application information such as:

* User information
* Subscription information
* Expense-related information
* Application data

Prisma provides a structured way for the backend to communicate with the database while maintaining a clear data-access layer.

---

# 🧠 AI Architecture

SubsRadar supports multiple AI approaches.

## ☁️ Gemini

Google Gemini can be used for AI-powered processing through the Google GenAI SDK.

## 💻 Gemma + Ollama

The application can also communicate with a locally hosted Gemma model through Ollama.

```text
SubsRadar Backend
        │
        ├──────────────► Gemini API
        │
        │
        └──────────────► Ollama
                              │
                              ▼
                           Gemma
```

This provides flexibility between cloud-based AI processing and local model execution.

---

# 📊 Core Modules

The application can be conceptually divided into the following modules:

### 🔐 Authentication Module

Handles:

* Registration
* Login
* Password security
* JWT authentication
* Protected routes

### 💳 Subscription Module

Handles:

* Subscription records
* Costs
* Categories
* Billing cycles
* Renewal dates

### 📈 Analytics Module

Handles:

* Expense calculations
* Spending visualization
* Category analysis
* Monthly/yearly comparisons

### 🧾 Statement Analysis Module

Handles:

* Transaction processing
* Merchant recognition
* Subscription detection
* Expense classification

### 🤖 AI Module

Handles:

* AI analysis
* Recommendations
* Cancellation communication
* Intelligent subscription insights

---

# ☁️ Deployment

The application currently has a live deployment:

### 🌐 Live Demo

**https://subs-radar-gamma.vercel.app/**

For production deployment, sensitive configuration should be added through the hosting platform's environment-variable settings.

Recommended production variables include:

```text
DATABASE_URL
JWT_SECRET
GEMINI_API_KEY
OLLAMA_HOST
OLLAMA_MODEL
```

depending on which AI and database functionality is enabled.

---

# 🔒 Security Considerations

For production environments, the following practices should be followed:

* Use a strong random JWT secret.
* Never expose API keys in frontend code.
* Never commit `.env` files.
* Use HTTPS.
* Secure database credentials.
* Validate user input.
* Keep dependencies updated.
* Protect authenticated API routes.
* Use appropriate database permissions.
* Monitor production logs for suspicious activity.

---

# 🔮 Future Enhancements

SubsRadar can be extended with several additional capabilities.

### 🔔 Smart Notifications

* Renewal reminders
* Cancellation deadline reminders
* Spending alerts

### 📱 Mobile Application

A dedicated Android/iOS application could provide subscription monitoring on mobile devices.

### 🏦 Financial Integrations

Future versions could integrate with financial services to automatically identify recurring transactions.

### 📊 Advanced Analytics

Potential additions include:

* Spending predictions
* Subscription utilization scores
* Savings recommendations
* Monthly spending forecasts
* Yearly financial reports

### 🤖 Advanced AI

Future AI capabilities could include:

* Personalized savings plans
* Automatic subscription recommendations
* Unused subscription detection
* Spending anomaly detection
* Personalized financial summaries

### 🌍 Multi-Currency Support

Support for multiple currencies would make the platform more useful for international users.

---

# 👥 Team

**SubsRadar is a collaborative 4-member team project.**

Each team member contributes to different aspects of the application, including development, integration, AI functionality, database management, frontend/backend development, testing, and documentation.

| Team Member  | Contribution                     |
| ------------ | -------------------------------- |
| **SANKHYA BHATIA** | Frontend / UI Development        |
| **NEILSEN PAUL GOMES** | Backend / API Development        |
| **VIDOOSHI** | AI / ML Integration              |
| **RIDDHI GHOSH** | Database / Integration / Testing |


### 🤝 Collaborative Development

The project demonstrates collaborative software development involving:

* Git & GitHub
* Feature development
* Backend/frontend integration
* Database integration
* AI integration
* Testing and debugging
* Documentation
* Deployment

---

# 🧪 Development & Testing

Before deployment, the application should be tested across:

### Frontend

* User interface functionality
* Responsive layouts
* Form validation
* Dashboard rendering
* Charts and analytics

### Backend

* Authentication
* API responses
* Input validation
* Database operations
* Protected routes

### AI

* AI response generation
* Statement analysis
* Subscription categorization
* Cancellation content generation

### Database

* Data creation
* Data retrieval
* Data updates
* Data persistence
* Migration consistency

---

# 📌 Project Highlights

| Category             | Technology / Feature  |
| -------------------- | --------------------- |
| 👨‍💻 Project Type   | 4-Member Team Project |
| 🎨 Frontend          | React + TypeScript    |
| ⚡ Build Tool         | Vite                  |
| 🎨 Styling           | Tailwind CSS          |
| ⚙️ Backend           | Express + TypeScript  |
| 🔐 Authentication    | JWT                   |
| 🔑 Password Security | bcrypt                |
| 🗄️ Database Access  | Prisma                |
| 🤖 Cloud AI          | Google Gemini         |
| 🧠 Local AI          | Gemma                 |
| 💻 Local AI Runtime  | Ollama                |
| 📊 Charts            | Recharts              |
| 📄 PDF               | jsPDF                 |
| 🎬 Animations        | Motion                |
| 🎯 Icons             | Lucide React          |
| ☁️ Deployment        | Vercel                |

---

# 🌟 Why SubsRadar?

SubsRadar goes beyond being a simple subscription list.

The platform combines:

```text
                ┌──────────────────────┐
                │ Subscription Tracking│
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Expense Management   │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Financial Analytics  │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Renewal Intelligence │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ AI-Powered Insights  │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Actionable Decisions │
                └──────────────────────┘
```

The goal is not simply to tell users **what they spend**, but to help them understand:

> **What they are paying for, how much it costs over time, when they will be charged, and what they can do about it.**

---

# 🤝 Contributing

Contributions and suggestions are welcome.

### 1. Fork the Repository

```bash
git clone https://github.com/riddhighosh2025/SubsRadar.git
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature
```

### 3. Make Your Changes

Implement and test the feature locally.

### 4. Commit Your Changes

```bash
git add .
git commit -m "Add: your feature"
```

### 5. Push Your Branch

```bash
git push origin feature/your-feature
```

### 6. Open a Pull Request

Describe your changes and submit a pull request for review.

---

# 📈 Project Status

🚧 **Active Development**

SubsRadar is an evolving project with ongoing improvements in:

* Subscription management
* Expense analytics
* AI-powered analysis
* User experience
* Database functionality
* Deployment
* Security
* Automation

---

# 📄 License

This project developed for educational and hackathon purposes.

---

# ⭐ Support the Project

If you find SubsRadar interesting:

⭐ **Star the repository**

🍴 **Fork the project**

🐛 **Report bugs**

💡 **Suggest improvements**

🤝 **Contribute**

---

<div align="center">

# 📡 SubsRadar

### Track. Analyze. Understand. Take Control.

Built with ❤️ BY TEAM INFINITELOOPERS

</div>
