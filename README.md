# Whack-A-Prof 🎮

A fast-paced, arcade-style browser game built with TypeScript, featuring professors and faculty members popping out of holes. Hit them with your mallet to score points before time runs out!

![Whack-A-Prof Gameplay](https://github.com/user-attachments/assets/6a5045fc-5b75-4783-b124-c120687f2d6f)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Game Mechanics](#game-mechanics)
- [API Endpoints](#api-endpoints)
- [Database Setup](#database-setup)
- [Development](#development)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**Whack-A-Prof** is a semester-long project for CISC 3140: Design and Implementation of Large-Scale Applications. This modern take on the classic Whack-A-Mole game features:

- Custom animations and sound effects
- Multiple weapon selections
- High score leaderboard with PostgreSQL backend
- Special bonus characters (Trustees) with explosion animations
- Responsive design with custom cursor

## ✨ Features

- **Engaging Gameplay**: 30-second rounds with dynamic character spawning
- **Weapon Selection**: Choose between two different mallets
- **Special Characters**: Hit the Trustee for +20 bonus points and trigger explosion animations
- **Persistent Leaderboard**: High scores saved to PostgreSQL database
- **Interactive Tutorial**: Learn the game mechanics before playing
- **Custom Cursor**: Weapon-themed cursor that animates on click
- **Sound Effects**: Immersive audio feedback for hits, misses, and special events
- **Responsive UI**: Scales to different screen sizes

## 🛠️ Tech Stack

### Frontend
- **TypeScript** - Type-safe game logic
- **HTML5** - Structure and markup
- **CSS3** - Styling and animations
- **Vanilla JavaScript** - No framework dependencies

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **PostgreSQL** - Database for high scores
- **TypeScript** - Type-safe server code

### Development Tools
- **TypeScript Compiler** - Transpilation
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
Whack-A-Prof/
├── Whack-A-Prof/           # Main game directory
│   ├── src/                # TypeScript source files
│   │   └── script.ts       # Main game logic
│   ├── dist/               # Compiled JavaScript
│   ├── server/             # Backend server
│   │   ├── src/
│   │   │   ├── index.ts    # Express server
│   │   │   ├── db/         # Database configuration
│   │   │   │   ├── config.ts
│   │   │   │   └── init.ts
│   │   │   └── routes/     # API routes
│   │   │       └── scores.ts
│   │   ├── dist/           # Compiled server code
│   │   └── package.json    # Server dependencies
│   ├── game.html           # Main HTML file
│   ├── game.css            # Styles and animations
│   ├── script.js           # Legacy JavaScript (being migrated)
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── assets/                 # Game assets
│   ├── Animation/          # Images and sounds
│   └── final/              # Final assets
├── specifications.pdf      # Project specifications
└── README.md              # This file
```

## 🚀 Installation

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Whack-A-Prof.git
   cd Whack-A-Prof
   ```

2. **Install frontend dependencies**
   ```bash
   cd Whack-A-Prof
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `Whack-A-Prof/server/` directory:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=whack_a_prof
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

5. **Initialize the database**
   ```bash
   # From the server directory
   npm run build
   npm run db:init
   ```

## 💻 Usage

### Development Mode

1. **Start the TypeScript compiler (watch mode)**
   ```bash
   # From Whack-A-Prof directory
   npm run dev
   ```

2. **Start the backend server**
   ```bash
   # From Whack-A-Prof/server directory
   npm run dev
   ```

3. **Open your browser**
   ```
   http://localhost:3000
   ```

### Production Mode

1. **Build the frontend**
   ```bash
   cd Whack-A-Prof
   npm run build
   ```

2. **Build and start the server**
   ```bash
   cd server
   npm run build
   npm start
   ```

## 🎮 Game Mechanics

### Objective
Click on professors as they pop out of holes to score points. Avoid clicking on empty holes (miss penalty).

### Scoring
- **Professor Hit**: +10 points
- **Trustee Hit**: +20 points (bonus character)
- **Miss**: -5 points

### Special Features
- **Trustee Appearance**: 5% probability on each spawn
- **Explosion Animation**: Triggered when hitting a Trustee
- **Character Duration**: 2 seconds per appearance
- **Game Duration**: 30 seconds per round

### Controls
- **Mouse Click**: Hit characters
- **Pause Button**: Pause/resume the game
- **Start Game**: Begin a new round
- **Back Button**: Return to main menu

## 🔌 API Endpoints

### Get High Scores
```http
GET /api/scores
```
**Response:**
```json
{
  "success": true,
  "scores": [
    { "name": "Player1", "score": 150 },
    { "name": "Player2", "score": 120 }
  ]
}
```

### Save High Score
```http
POST /api/scores
Content-Type: application/json

{
  "name": "PlayerName",
  "score": 150
}
```
**Response:**
```json
{
  "success": true,
  "score": {
    "name": "PlayerName",
    "score": 150
  }
}
```

### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-16T23:07:38.000Z"
}
```

## 🗄️ Database Setup

The game uses PostgreSQL to store high scores. The database schema is automatically created when running `npm run db:init`.

### Schema
```sql
CREATE TABLE high_scores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_high_scores_score ON high_scores(score DESC);
```

## 🔧 Development

### TypeScript Compilation

**Frontend:**
```bash
npm run build    # Compile once
npm run watch    # Watch mode
npm run dev      # Watch mode (alias)
```

**Backend:**
```bash
npm run build       # Compile once
npm run dev:build   # Watch mode
npm run dev:run     # Run with auto-reload
npm run dev         # Build watch + run watch
```

### Code Structure

- **Game Class**: Core game logic, state management, and timing
- **UI Module**: DOM manipulation, event handling, and display updates
- **API Functions**: High score retrieval and saving
- **Configuration**: Centralized game settings in `config` object

### Key TypeScript Interfaces

```typescript
interface GameConfig {
  availableTime: number;
  characterDuration: number;
  trusteeProbability: number;
  trusteePoints: number;
  // ... more config
}

interface HighScore {
  name: string;
  score: number;
}
```

## 📸 Screenshots

### Main Menu
<img width="1889" height="916" alt="Main Menu" src="https://github.com/user-attachments/assets/6a5045fc-5b75-4783-b124-c120687f2d6f" />

### Weapon Selection
<img width="1882" height="918" alt="Weapon Selection" src="https://github.com/user-attachments/assets/611a665d-ece5-4f11-8264-6d7a4d580969" />

### Gameplay
<img width="1901" height="914" alt="Gameplay" src="https://github.com/user-attachments/assets/f5f93fc0-2a7b-418f-8a5d-6b0cba8806ce" />

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow TypeScript best practices
- Maintain consistent code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the ISC License.

## 🎓 Academic Context

This project was developed as part of **CISC 3140: Design and Implementation of Large-Scale Applications**. It demonstrates:

- Full-stack web development
- TypeScript integration
- Database design and integration
- RESTful API design
- Game development principles
- Responsive UI/UX design

## 🙏 Acknowledgments

- Course: CISC 3140 - Design and Implementation of Large-Scale Applications
- Original concept inspired by the classic Whack-A-Mole arcade game
- Assets and animations created specifically for this project

---

**Enjoy playing Whack-A-Prof!** 🎯🔨
