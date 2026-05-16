# BobInsight - Quick Reference Guide
## 72-Hour Hackathon Cheat Sheet

---

## 🚀 QUICK START CHECKLIST

### Day 1 (May 15) - Foundation
- [ ] **9:00 AM**: Environment setup complete
- [ ] **11:00 AM**: Mock graph rendering works
- [ ] **1:00 PM**: Lunch break
- [ ] **3:00 PM**: Backend API skeleton ready
- [ ] **6:00 PM**: IBM Bob API test successful
- [ ] **9:00 PM**: End-to-end flow working (mock data)
- [ ] **12:00 AM**: Sleep (6 hours)

### Day 2 (May 16) - Core Build
- [ ] **6:00 AM**: Wake up and kickoff
- [ ] **9:00 AM**: Live API integration working
- [ ] **12:00 PM**: Function Inspector Panel complete
- [ ] **3:00 PM**: Integration testing done
- [ ] **6:00 PM**: FEATURE FREEZE
- [ ] **9:00 PM**: All bugs fixed
- [ ] **12:00 AM**: Sleep (6 hours)

### Day 3 (May 17) - Polish & Demo
- [ ] **6:00 AM**: Wake up and final polish
- [ ] **9:00 AM**: Production deployment complete
- [ ] **12:00 PM**: Lunch and rehearsal
- [ ] **3:00 PM**: Dry Run #1
- [ ] **6:00 PM**: Final refinements
- [ ] **9:00 PM**: Dry Run #2
- [ ] **6:00 PM (Demo)**: SHOWTIME!

---

## 👥 ROLE QUICK REFERENCE

### Dev 1 (Frontend UI/UX)
**Focus**: User interface, forms, layouts, navigation
**Key Deliverables**:
- Repository input form
- Results page layout
- Function Inspector Panel
- Loading states and error handling

### Dev 2 (Data Visualization)
**Focus**: React Flow graph, node interactions, visual polish
**Key Deliverables**:
- Interactive function flow graph
- Node expand/collapse functionality
- Graph layout algorithms
- Export functionality

### Dev 3 (Backend Engineer)
**Focus**: API routes, Git operations, file parsing, caching
**Key Deliverables**:
- `/api/analyze` endpoint
- Git clone service
- File system parser
- Caching layer

### Dev 4 (AI Integration)
**Focus**: IBM Bob API integration, prompt engineering, fallbacks
**Key Deliverables**:
- IBM Bob API service
- Prompt templates
- Response parser
- Fallback mechanisms

### Dev 5 (PM/Pitcher)
**Focus**: Timeline management, pitch deck, demo coordination
**Key Deliverables**:
- Hourly check-ins
- Pitch deck (20 slides)
- Demo script
- Risk management

---

## 🎯 CRITICAL MILESTONES

| Time | Milestone | Success Criteria |
|------|-----------|------------------|
| Hour 2 | Environment Ready | All devs can run code locally |
| Hour 4 | Mock Graph Works | React Flow renders 10 functions |
| Hour 9 | Backend-AI Pipeline | Can call IBM Bob API successfully |
| Hour 12 | End-to-End Flow | User can input URL → see graph |
| Hour 15 | Live API Integration | Real repos analyzed via Bob API |
| Hour 18 | Inspector Panel | Click function → see details |
| Hour 24 | Core Features Done | All major features integrated |
| Hour 27 | **FEATURE FREEZE** | No new features after this |
| Hour 39 | Demo-Ready | Stable app, tested scenarios |
| Hour 42 | Production Deploy | Live URL accessible |
| Hour 48 | Dry Run #1 | Full pitch + demo rehearsed |
| Hour 66 | **SHOWTIME** | Pitch delivered! |

---

## 🚨 EMERGENCY PROTOCOLS

### If IBM Bob API Fails
1. **Check**: API credentials, rate limits, network
2. **Fallback A**: Use pre-cached mock responses
3. **Fallback B**: Use local AST parser (basic)
4. **Fallback C**: Pre-analyze 3 demo repos

### If Demo Laptop Crashes
1. **Backup Laptop**: Have second laptop ready
2. **Pre-recorded Video**: Play video while narrating
3. **Cloud Backup**: Access demo from cloud URL
4. **Stay Calm**: Apologize briefly, continue confidently

### If Internet Goes Down
1. **Mobile Hotspot**: Use phone as backup internet
2. **Local Demo**: Run demo on localhost
3. **Video Backup**: Play pre-recorded demo
4. **Pivot**: Focus on architecture and vision

### If Team Member Unavailable
1. **Cross-training**: Everyone knows basics of each role
2. **Backup Presenter**: Dev 1 can present if Dev 5 unavailable
3. **Backup Demo Operator**: Dev 3 can run demo if Dev 2 unavailable
4. **Documentation**: All code well-documented for handoff

---

## 📋 DAILY STANDUP TEMPLATE

### Questions to Answer (5 minutes per person)
1. **What did you accomplish since last standup?**
2. **What are you working on next?**
3. **Any blockers or risks?**
4. **Do you need help from anyone?**

### Standup Schedule
- **Day 1**: 9:00 AM, 3:00 PM, 6:00 PM, 9:00 PM
- **Day 2**: 6:00 AM, 9:00 AM, 3:00 PM, 6:00 PM, 9:00 PM
- **Day 3**: 6:00 AM, 9:00 AM, 4:00 PM

---

## 🎤 PITCH STRUCTURE (5 MINUTES)

### Slide 1-2: Problem (30 seconds)
- "Onboarding to legacy codebases takes weeks"
- "Traditional tools show folders, not logic flows"

### Slide 3-5: Solution (45 seconds)
- "BobInsight: X-Ray vision for source code"
- "Powered by IBM Bob API"

### Slide 6-8: Technical Architecture (45 seconds)
- "React + Node.js + React Flow + IBM Bob API"
- "Automated function-level dependency mapping"

### Slide 9-10: Market Opportunity (30 seconds)
- "Enterprise developer tools market: $10B+"
- "Target: Fortune 500 engineering teams"

### Slide 11-12: Call to Action (30 seconds)
- "Join us in revolutionizing code comprehension"
- "Demo time!"

---

## 🎬 DEMO SCRIPT (5 MINUTES)

### Minute 1: Introduction
- Show landing page
- Explain value proposition
- Input GitHub URL

### Minute 2: Analysis
- Show real-time progress
- Explain what's happening behind the scenes
- Build anticipation

### Minute 3: Graph Reveal
- Reveal interactive function flow graph
- Zoom and pan to show scale
- Highlight visual appeal

### Minute 4: Interaction
- Click on a function node
- Show Function Inspector Panel
- Explain dependencies and code preview

### Minute 5: Advanced Features
- Demonstrate path highlighting
- Show complexity heatmap
- Explain business value

---

## 💾 BACKUP CHECKLIST

### Code Backups
- [ ] Push to GitHub every 2 hours
- [ ] Tag important milestones
- [ ] Keep local backups on USB drive

### Demo Backups
- [ ] Pre-recorded demo video (YouTube unlisted)
- [ ] Screenshots of key features
- [ ] Backup laptop with full setup

### Pitch Backups
- [ ] Pitch deck on Google Slides (accessible anywhere)
- [ ] PDF version on USB drive
- [ ] Printed speaker notes

### Data Backups
- [ ] Pre-cached 3 demo repositories
- [ ] Mock JSON responses ready
- [ ] Local database backup

---

## 🔧 TECH STACK QUICK REFERENCE

### Frontend
- **Framework**: React 18+ with Vite
- **Visualization**: React Flow
- **Styling**: Tailwind CSS
- **State**: React Context or Zustand
- **HTTP**: Axios

### Backend
- **Framework**: Node.js + Express
- **Git Operations**: simple-git
- **File Parsing**: fs, path modules
- **Caching**: node-cache or Redis
- **CORS**: cors middleware

### AI Integration
- **API**: IBM Bob API
- **HTTP Client**: axios
- **Retry Logic**: axios-retry
- **Rate Limiting**: bottleneck

### DevOps
- **Frontend Deploy**: Vercel or Netlify
- **Backend Deploy**: Heroku or Railway
- **Monitoring**: Sentry
- **Analytics**: LogRocket (optional)

---

## 📞 COMMUNICATION PROTOCOLS

### Slack/Discord Channels
- **#general**: Team-wide announcements
- **#frontend**: Dev 1 & Dev 2 coordination
- **#backend**: Dev 3 & Dev 4 coordination
- **#blockers**: Urgent issues needing help
- **#wins**: Celebrate small victories!

### Status Updates
- **🟢 Green**: On track, no issues
- **🟡 Yellow**: Minor delays, manageable
- **🔴 Red**: Blocked, need immediate help

### Response Time Expectations
- **Critical Issues**: <15 minutes
- **Questions**: <30 minutes
- **Code Reviews**: <1 hour
- **Feature Requests**: Defer to post-hackathon

---

## 🎯 DEMO DAY CHECKLIST

### 2 Hours Before Demo
- [ ] Test demo laptop at venue
- [ ] Verify internet connection
- [ ] Test screen projection
- [ ] Run through demo once
- [ ] Charge all devices

### 1 Hour Before Demo
- [ ] Final pitch rehearsal
- [ ] Bathroom break
- [ ] Hydrate and light snack
- [ ] Mental preparation
- [ ] Team pep talk

### 30 Minutes Before Demo
- [ ] Set up at presentation area
- [ ] Test microphone
- [ ] Open all necessary tabs/apps
- [ ] Close unnecessary applications
- [ ] Deep breaths, stay calm

### During Demo
- [ ] Speak clearly and confidently
- [ ] Make eye contact with judges
- [ ] Stick to time limits
- [ ] Handle Q&A gracefully
- [ ] Thank judges and audience

### After Demo
- [ ] Collect feedback
- [ ] Network with other teams
- [ ] Celebrate with team
- [ ] Wait for results

---

## 🏆 SUCCESS MANTRAS

1. **"Done is better than perfect"** - Ship working features over perfect code
2. **"Demo or die"** - The demo is everything, prioritize accordingly
3. **"Communicate constantly"** - Over-communication prevents disasters
4. **"Adapt and overcome"** - Plans change, stay flexible
5. **"Team first"** - Support each other, win together

---

## 📊 PROGRESS TRACKING

### Use This Format for Updates
```
[Time] [Dev Name] [Status]
What: [What you're working on]
Progress: [% complete or milestone reached]
Blockers: [Any issues]
Next: [What's next]
```

Example:
```
[3:00 PM] [Dev 2] [🟢 Green]
What: React Flow graph rendering
Progress: 80% - Basic graph works, adding interactions
Blockers: None
Next: Implement node expand/collapse
```

---

## 🎓 LESSONS TO REMEMBER

### Technical Lessons
- Start with mock data, integrate real APIs later
- Test early, test often
- Keep architecture simple
- Document as you go
- Version control is your friend

### Team Lessons
- Clear communication prevents conflicts
- Regular check-ins keep everyone aligned
- Celebrate small wins to maintain morale
- Ask for help early, don't struggle alone
- Trust your teammates

### Hackathon Lessons
- Scope creep is the enemy
- Feature freeze is sacred
- Demo preparation is as important as coding
- Sleep is not optional
- Have fun and learn!

---

**Remember: You've prepared well, you have a solid plan, and you have a great team. Trust the process, stay focused, and deliver an amazing demo! 🚀**

**Good luck, Team BobInsight!**