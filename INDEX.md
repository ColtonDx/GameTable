# GameTable Documentation Index

Welcome! Here's how to navigate the GameTable project.

## 📋 Quick Navigation

### I want to... | Start here
---|---
**Play the game** | [QUICKSTART.md](QUICKSTART.md)
**Understand the architecture** | [SETUP.md](SETUP.md)
**Modify the code** | [DEVELOPER.md](DEVELOPER.md)
**Test features** | [TESTING.md](TESTING.md)
**Check API format** | [API.md](API.md)
**Get project overview** | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

## 📚 Documentation by Role

### 👤 Player
Just want to play?
1. [QUICKSTART.md](QUICKSTART.md) - 5 minute setup
2. Open `http://localhost:3001`
3. Create or join a game
4. Have fun!

**Time investment:** 5 minutes

### 🛠️ Developer
Want to modify/extend?
1. [SETUP.md](SETUP.md) - Understand architecture (15 min)
2. [DEVELOPER.md](DEVELOPER.md) - Learn how to modify code (20 min)
3. Read code in [backend/src/](backend/src/) and [frontend/src/](frontend/src/)
4. [TESTING.md](TESTING.md) - Test your changes
5. Deploy with Docker

**Time investment:** 1-2 hours to get productive

### 🚀 DevOps/Deployment
Want to deploy?
1. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overview
2. Use [Dockerfile](Dockerfile) and [docker-compose.yml](docker-compose.yml)
3. Deploy to your infrastructure
4. Monitor with logs

**Time investment:** 1 hour

### 🎓 Architect/Reviewer
Want to review the design?
1. [SETUP.md](SETUP.md) - Architecture & decisions
2. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Feature summary
3. Review code structure
4. Check [Future Enhancements](#) section

**Time investment:** 30 minutes

---

## 📖 Documentation Structure

```
QUICKSTART.md           ← START HERE (5 min read)
├─ Fast setup guide
├─ How to test
└─ Common tasks

SETUP.md               ← Architecture deep dive (15 min)
├─ Tech stack decisions
├─ Data structures
├─ Communication protocol
└─ Scalability path

DEVELOPER.md           ← Code changes guide (20 min)
├─ Project layout
├─ Data structures
├─ Common modifications
├─ Testing patterns
└─ Performance tips

API.md                 ← Protocol reference (10 min)
├─ Connection format
├─ Message types
├─ HTTP endpoints
└─ Example flows

TESTING.md            ← Test procedures (15 min)
├─ Manual tests
├─ Edge cases
├─ Performance benchmarks
└─ Regression checklist

PROJECT_SUMMARY.md    ← Executive overview (10 min)
├─ Feature list
├─ Tech stack rationale
├─ File structure
├─ Performance metrics
└─ Scalability path

README.md             ← Full feature list (5 min)
├─ What it does
├─ Getting started
├─ How to play
└─ API overview
```

---

## 🎯 Common Paths

### Path 1: Just Play
```
QUICKSTART.md
    ↓
Run docker-compose
    ↓
Play!
```
**Time:** 5 minutes

### Path 2: Understand & Develop
```
SETUP.md (understand architecture)
    ↓
DEVELOPER.md (learn how to modify)
    ↓
Review code (backend/src/, frontend/src/)
    ↓
TESTING.md (test your changes)
    ↓
Deploy with Docker
```
**Time:** 2-3 hours

### Path 3: Deploy to Production
```
PROJECT_SUMMARY.md (overview)
    ↓
SETUP.md (architecture decisions)
    ↓
Dockerfile & docker-compose.yml
    ↓
Scale with load balancer
    ↓
Monitor and maintain
```
**Time:** Variable

### Path 4: Review Code Quality
```
PROJECT_SUMMARY.md (summary)
    ↓
SETUP.md (design decisions)
    ↓
backend/src/ (400 lines)
    ↓
frontend/src/ (600 lines)
    ↓
DEVELOPER.md (modification patterns)
```
**Time:** 1 hour

---

## 📁 File Organization

### Documentation Files (Read these!)
- `README.md` - What the project does
- `QUICKSTART.md` - Get started in 5 minutes
- `SETUP.md` - Architecture & design
- `DEVELOPER.md` - How to modify code
- `API.md` - Message formats
- `TESTING.md` - Test procedures
- `PROJECT_SUMMARY.md` - Executive overview
- `INDEX.md` - This file

### Configuration Files (Don't edit usually)
- `Dockerfile` - Container image
- `docker-compose.yml` - Local deployment
- `.gitignore` - Git configuration
- `.dockerignore` - Docker build ignore

### Backend Code
- `backend/Cargo.toml` - Rust dependencies
- `backend/src/main.rs` - Server setup
- `backend/src/game.rs` - Game logic
- `backend/src/websocket.rs` - Real-time messaging
- `backend/src/handlers.rs` - HTTP endpoints

### Frontend Code
- `frontend/package.json` - NPM dependencies
- `frontend/public/index.html` - HTML template
- `frontend/src/index.js` - React entry
- `frontend/src/App.js` - Root component
- `frontend/src/components/Lobby.js` - Game join
- `frontend/src/components/GameTable.js` - Main game
- `frontend/src/components/PlayerZone.js` - Card zones
- `frontend/src/styles/*.css` - Styling

---

## 🚀 Quick Start by Goal

### "I want to play"
→ Run [QUICKSTART.md](QUICKSTART.md) (5 min)

### "I want to add a feature"
→ Read [DEVELOPER.md](DEVELOPER.md) (20 min)

### "I want to understand the code"
→ Read [SETUP.md](SETUP.md) then review [backend/src/game.rs](backend/src/game.rs)

### "I want to deploy this"
→ Check [Dockerfile](Dockerfile) and [docker-compose.yml](docker-compose.yml)

### "I want to test thoroughly"
→ Follow [TESTING.md](TESTING.md) (30 min)

### "I want an overview"
→ Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) (10 min)

---

## 💡 Feature Overview

✅ **Working Now:**
- 4 players can connect remotely
- Real-time life total tracking
- Card zones (Hand, Battlefield, Graveyard, Exile, Command Zone)
- Player rejoin without data loss
- Browser-based responsive UI
- Docker deployment

⚠️ **Coming Soon:**
- Deck building/import
- Drag-and-drop cards
- Card images
- Turn order tracking
- Persistent storage

🔲 **Planned:**
- User accounts
- Tournament support
- Mobile app
- AI opponents

---

## 🆘 Help & Troubleshooting

**Q: Where do I start?**  
A: Go to [QUICKSTART.md](QUICKSTART.md)

**Q: How do I modify the code?**  
A: See [DEVELOPER.md](DEVELOPER.md)

**Q: How does it work?**  
A: Read [SETUP.md](SETUP.md)

**Q: What messages can I send?**  
A: Check [API.md](API.md)

**Q: How do I test?**  
A: Follow [TESTING.md](TESTING.md)

**Q: Connection refused?**  
A: See [TESTING.md - Troubleshooting](TESTING.md#troubleshooting)

**Q: Code not compiling?**  
A: Run `cargo check` in backend/ for error details

**Q: Frontend not updating?**  
A: Check browser DevTools → Network → WS tab

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Total Code | ~1000 lines |
| Backend (Rust) | ~400 lines |
| Frontend (React) | ~600 lines |
| Documentation | 64KB |
| Setup Time | 5 minutes |
| First Game | 10 minutes |

---

## 🗂️ Documentation Reading Time

| Document | Read Time | Best For |
|----------|-----------|----------|
| QUICKSTART.md | 5 min | Getting started |
| README.md | 5 min | Feature overview |
| SETUP.md | 15 min | Understanding design |
| API.md | 10 min | WebSocket integration |
| TESTING.md | 15 min | Quality assurance |
| DEVELOPER.md | 20 min | Code modifications |
| PROJECT_SUMMARY.md | 10 min | Executive overview |

**Total: ~90 minutes** for comprehensive understanding

---

## 🎓 Learning Path

### If you're new to the project:
1. **5 min**: [QUICKSTART.md](QUICKSTART.md)
2. **10 min**: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
3. **15 min**: [SETUP.md](SETUP.md) - Architecture section
4. **20 min**: Code review in [backend/src/game.rs](backend/src/game.rs)

**Total: 50 minutes** → Productive understanding

### If you want to contribute:
1. Read all above ↑
2. **20 min**: [DEVELOPER.md](DEVELOPER.md)
3. **15 min**: [TESTING.md](TESTING.md)
4. **30 min**: Make a small change
5. **10 min**: Test it

**Total: 2 hours** → Ready to contribute

---

## ✅ Verification Checklist

- [ ] Can start server with `docker-compose up --build`
- [ ] Can access UI at `http://localhost:3001`
- [ ] Can create a game
- [ ] Can join a game with game ID
- [ ] Can see life totals update
- [ ] Can draw cards
- [ ] Can read and understand [SETUP.md](SETUP.md)
- [ ] Can find code location for any feature
- [ ] Can run tests with [TESTING.md](TESTING.md)

---

## 📞 Getting Help

1. **Error message?** → Check [TESTING.md#Troubleshooting](TESTING.md)
2. **Code question?** → Check [DEVELOPER.md](DEVELOPER.md)
3. **Architecture question?** → Check [SETUP.md](SETUP.md)
4. **API format question?** → Check [API.md](API.md)
5. **Feature question?** → Check [README.md](README.md)

---

**Start here:** [QUICKSTART.md](QUICKSTART.md) (5 minutes to playing!)

**Explore full docs:** Files listed above

**Happy gaming!** 🎮

---

*Last Updated: January 2026*
