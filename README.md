# 🎈 Balloon Bounce

A fun, lightweight arcade game where you control a balloon, dodge obstacles, collect coins, and try not to pop!

## 🎮 Gameplay

Hold to inflate and rise. Release to descend. Navigate through obstacles, collect coins, and survive as long as possible!

## ✨ Features

- Balloon inflation-based movement and physics
- Pipe and obstacle collision detection
- Coin collection and multiple coin formations
- Crow obstacles
- Distance tracking
- Multiple balloon colours and background themes
- Game-over animation and replay functionality
- Player score saving
- Django-powered leaderboard

## 🛠️ Tech Stack

- HTML
- CSS
- JavaScript (Canvas)
- Python
- Django
- SQLite

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Sowmya07484/balloon-bounce.git
cd balloon-bounce
```

### 2. Set up the backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install django django-cors-headers
python3 manage.py migrate
python3 manage.py runserver
```

### 3. Play the game

Open `index.html` in your browser to play.

Ensure the Django backend is running for score saving and leaderboard functionality.

## 👩‍💻 Developer

**N.V. Sowmya**

GitHub: [@Sowmya07484](https://github.com/Sowmya07484)

---

Built as a mini-project to explore game development, JavaScript Canvas, and Django backend integration.