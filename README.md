# 🏏 Real-Time Cricket Auction System

A professional, real-time auction platform designed for cricket leagues (IPL style). Features a specialized Admin Dashboard, real-time Team Bidding Arenas, and a dedicated "Projector View" for the big screen.

## 🌟 Key Features
*   **Real-Time Bidding**: Socket.io powered instant bid updates across all clients.
*   **Role-Based Access**:
    *   **Admin**: Manage teams, players, pause/resume auction, and manual controls.
    *   **Team**: Live bidding interface, AI bid suggestions, chat, and purse tracking.
    *   **Projector**: Broadcast-quality view for the audience with animations and audio.
*   **Smart Logic**:
    *   **Purse Validation**: Prevents overspending.
    *   **Squad Limits**: Enforces Min/Max squad size and foreign player limits.
    *   **Anti-Snipe Lock**: Prevents last-millisecond bids (<0.25s) to ensure fairness.
    *   **AI Assist**: Suggests safe bid limits based on remaining purse and requirements.
*   **Audio/Visual Effects**: Integrated sounds for "Sold", "Unsold", and "New Player". Confetti and flash animations.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd auc
    ```

2.  **Install Dependencies** (Root & Server):
    ```bash
    npm install
    cd server && npm install
    cd ..
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory (optional for dev, but good practice):
    ```env
    VITE_API_URL=http://localhost:4000
    ```
    Create a `.env` file in `server/`:
    ```env
    JWT_SECRET=your_super_secret_key_here
    PORT=4000
    ```

### Running the Application

To start both the Backend and Frontend concurrently:

```bash
npm run dev:full
```

*   **Frontend**: `http://localhost:5173` (or 5174)
*   **Backend**: `http://localhost:4000`

## 🔑 Default Credentials

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full control |
| **Auctioneer** | `auctioneer` | `auctioneer123` | Controls only |
| **Team: CSK** | `csk` | `csk123` | Yellow Team |
| **Team: RCB** | `rcb` | `rcb123` | Red Team |
| **Team: MI** | `mi` | `mi123` | Blue Team |

*(See `server/auth.js` for full list of team credentials)*

## 📱 Views

1.  **Admin Portal** (`/admin/login`):
    *   Control the flow: Start round, Set Player, Sell/Unsold.
    *   Manage Database: Add/Edit Players and Teams.

2.  **Team Arena** (`/team/login`):
    *   The primary interface for team owners to bid.
    *   Includes "AI Strategy Insight" card for assistance.

3.  **Projector View** (`/projector`):
    *   Open this on a secondary monitor or projector.
    *   Displays current player, highest bid, and "SOLD" animations.
    *   **Note**: Click anywhere on the page once to enable Audio.

## 🛠️ Tech Stack
*   **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Zustand.
*   **Backend**: Node.js, Express, Socket.io.
*   **Data**: JSON-based flat file (`server/db.json`).

## ⚠️ Notes for Organizer
*   **Anti-Snipe**: The system enforces a 250ms "Lock" at the end of the timer. Teams must bid before the timer turns RED.
*   **Pause**: You can pause the auction from the Admin dashboard at any time. Bidding is disabled while paused.
