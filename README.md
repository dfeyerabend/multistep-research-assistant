# Multi-Step Research Assistant Agent

A powerful research assistant built with LangGraph that performs automated research tasks using AI agents. The agent can analyze queries, conduct web searches, and generate comprehensive research reports.

##  Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Live Demo](#live-demo)
- [Technology Stack](#technology-stack)
- [License](#license)

##  Overview

This repository contains a multi-step research assistant agent that leverages LangGraph for workflow orchestration and OpenAI for natural language processing. The application consists of two main components:

- **Backend**: Express.js server that handles the AI agent logic and API endpoints
- **Frontend**: React + TypeScript GUI for user interaction

##  Project Structure

```
multistep-research-assistant-agent/
├── Backend/          # Server-side application
│   ├── server.js     # Main Express server with LangGraph agent
│   ├── package.json  # Backend dependencies
│   └── .env         # Backend environment variables (not tracked)
│
├── Frontend/         # Client-side application
│   ├── src/          # React source files
│   ├── package.json  # Frontend dependencies
│   └── .env         # Frontend environment variables (not tracked)
│
└── README.md
```

## Features

- 🤖 AI-powered research agent using LangGraph
- 🔍 Web search integration via Tavily API
- 💬 Natural language query processing with OpenAI
- 💾 Report storage with Appwrite database
- 🎨 Modern React-based user interface
- 🔄 Real-time research progress updates

## 🌐 Live Demo

- The application is also deployed and available online at:
- **https://multistep-research-assistant-lecw29gcn-feyerades-projects.vercel.app**

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- API keys for:
  - OpenAI
  - Tavily (for web search)
  - Appwrite (for database storage)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd multistep-research-assistant-agent
```

### 2. Install Dependencies

**Backend:**
```bash
cd Backend
npm install
```

**Frontend:**
```bash
cd Frontend
npm install
```

For a complete list of dependencies, check the `package.json` files in the respective folders.

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `Backend` folder with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Tavily Search Configuration
TAVILY_API_KEY=your_tavily_api_key_here

# Appwrite Database Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_appwrite_project_id
APPWRITE_DATABASE_ID=your_appwrite_database_id
APPWRITE_COLLECTION_ID=your_appwrite_collection_id
APPWRITE_API_KEY=your_appwrite_api_key

# Server Configuration
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

### Frontend Environment Variables

Create a `.env` file in the `Frontend` folder with the following variable:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001
```

> **Note:** Never commit your `.env` files to version control. They are already included in `.gitignore`.

## Running Locally

### Start the Backend Server

```bash
cd Backend
npm start
```

The backend server will start on `http://localhost:3001` (or the port specified in your `.env` file).

### Start the Frontend Development Server

```bash
cd Frontend
npm run dev
```

The frontend will start on `http://localhost:5173`. Open this URL in your browser to use the application.


## 🛠 Technology Stack

### Backend
- **Express.js** - Web server framework
- **LangGraph** - AI agent workflow orchestration
- **LangChain** - LLM integration framework
- **OpenAI** - Language model for AI reasoning
- **Tavily** - Web search API
- **Appwrite** - Backend database service
- **Zod** - Schema validation

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **ESLint** - Code linting


---

**Made with ❤️ using LangGraph and React**

