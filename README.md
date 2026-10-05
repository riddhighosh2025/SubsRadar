# 📡 SubsRadar — AI-Powered Subscription Intelligence

**SubsRadar** is an AI-powered subscription management and spending intelligence platform that helps users **discover, track, analyze, and optimize recurring subscriptions**.

Instead of simply listing subscriptions, SubsRadar turns subscription data into actionable insights — helping users identify **unused services, unnecessary spending, upcoming renewals, and opportunities to save money**.

---

## 🚨 Problem

With the growing number of digital subscriptions, users often lose track of:

* 💸 How much they spend every month
* 🔄 Which subscriptions are renewing soon
* 😴 Which services they rarely use
* 📊 Where most of their recurring spending goes
* ⚠️ Which subscriptions may no longer be worth the cost

Small recurring payments can silently add up to a significant monthly and yearly expense.

**SubsRadar solves this by giving users a single intelligent dashboard for their recurring expenses.**

---

## 💡 Our Solution

SubsRadar combines **subscription tracking, spending analytics, usage-based insights, and AI-powered recommendations** in one platform.

Users can add or upload their subscription information, after which SubsRadar analyzes:

**Cost + Usage + Category + Renewal Date**

to generate meaningful insights.

### Example

> Netflix — ₹649/month — Used only 2 times

SubsRadar can identify this as a potentially **low-value subscription** and recommend that the user review or reconsider it.

---

## ✨ Key Features

### 📊 Subscription Dashboard

View all subscriptions in one place with:

* Monthly recurring cost
* Number of active subscriptions
* Upcoming renewals
* Subscription categories
* Usage statistics

### 💰 Spending Analysis

Understand where your recurring money goes through:

* Monthly subscription expenditure
* Category-wise spending
* Highest-cost subscriptions
* Estimated yearly expenditure

### 🧠 AI-Powered Insights

SubsRadar analyzes subscription data to provide personalized insights such as:

* **Low-usage subscriptions**
* **High-cost subscriptions**
* **Potential savings**
* **Subscriptions worth reviewing**
* **Spending patterns**

### 📅 Renewal Tracking

Keep track of upcoming renewal dates so users can review subscriptions before they are charged again.

### 📁 CSV Import

Users can quickly upload subscription data using a CSV file instead of manually entering every subscription.

Expected format:

```csv
name,monthly_cost,usage_count,category,next_renewal
Netflix,649,2,Entertainment,2026-10-09
Spotify,119,18,Entertainment,2026-10-15
Amazon Prime,299,5,Shopping,2026-10-20
```

### 🤖 Natural-Language Interaction

Users can interact with SubsRadar using natural language to understand their subscription spending and receive AI-generated recommendations.

---

## 🧩 How It Works

```text
        User
          │
          ▼
 ┌──────────────────┐
 │ Subscription Data│
 │ Manual / CSV     │
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │ Data Processing  │
 │ Cost + Usage +   │
 │ Category + Date  │
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │ AI Analysis      │
 │ & Insights       │
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │ SubsRadar        │
 │ Dashboard        │
 └────────┬─────────┘
          │
          ▼
   Actionable Insights
   & Saving Opportunities
```

---

## 🛠️ Tech Stack

### Frontend

* HTML / CSS / JavaScript
* [Add your frontend framework here if applicable]

### Backend

* Python
* FastAPI

### AI

* **Gemma 4**
* Gemini API

### Data

* CSV-based subscription import
* [Add database here if/when implemented]

---

## 🤖 Why Gemma 4?

Gemma 4 powers the intelligence layer of SubsRadar.

It can be used to understand subscription information and generate **context-aware recommendations** instead of simply displaying raw numbers.

For example:

**Input:**

> Netflix — ₹649/month — used 2 times

**AI Insight:**

> Your Netflix subscription has relatively low usage compared with its monthly cost. Consider reviewing whether it provides enough value for your current usage.

This allows SubsRadar to move beyond being a traditional expense tracker and become an **AI-powered subscription decision assistant**.

---

## 🎯 What Makes SubsRadar Different?

Traditional expense trackers primarily answer:

> **"How much did I spend?"**

SubsRadar aims to answer:

> **"Am I actually getting enough value from what I'm paying for?"**

By combining **cost, usage, renewal timing, and AI reasoning**, SubsRadar helps users make better decisions about recurring expenses.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd subscription-radar-ai
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

> Never commit your `.env` file or API keys to GitHub.

### 5. Start the backend

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 📂 Project Structure

```text
subscription-radar-ai/
│
├── app/
│   ├── main.py
│   ├── ...
│
├── requirements.txt
├── .gitignore
├── README.md
└── ...
```

---

## 🔐 Security

* API keys are stored using environment variables.
* `.env` files should never be committed to the repository.
* User subscription data should be handled securely.

---

## 🌱 Future Scope

SubsRadar can be extended with:

* 🔔 Automatic renewal reminders
* 🏦 Bank/transaction integration
* 📧 Email receipt/subscription detection
* 📈 Long-term spending trends
* 💡 Personalized saving plans
* 🧾 Automatic subscription detection from invoices
* 🤝 Shared/family subscription optimization
* 📱 Mobile application
* 🔄 Automatic usage tracking
* 🤖 More advanced AI-powered financial insights

---

## 🏆 Hackathon Focus

SubsRadar demonstrates how **AI can transform raw financial data into practical, personalized decisions**.

Rather than overwhelming users with financial dashboards, the goal is to provide simple answers to questions like:

> **What am I paying for?**

> **Am I using it enough?**

> **What is renewing soon?**

> **Where can I save?**

---

## 👥 Team

Built with ❤️ by **Team InfiniteLoopers**

* Sankhya Bhatia
* Riddhi Ghosh
* Neilsen Gomes
* Vidooshi

---

## 📜 License

This project is developed for educational and hackathon purposes.
