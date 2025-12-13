# PIMX Personal - V2Ray Server Scanner & Manager

A complete V2Ray server scanning and management system with separate backend and frontend architecture for optimal performance and reliability.

## 🌟 Overview

PIMX Personal is an advanced V2Ray server management platform that automatically scans, tests, and maintains a collection of high-quality V2Ray servers. The system operates independently with a robust backend that ensures continuous server availability without user intervention.

## 🚀 Key Features

### ⚡ Complete Independence
- **Autonomous Backend**: Server scanning and testing runs **without user intervention**
- **Refresh-Proof**: Page refresh or closing has no impact on scanning operations
- **Always Ready**: Servers are always available in the database

### 🔄 Automated Scanning
- **Initial Scan**: Starts immediately after backend startup
- **Hourly Scans**: Automatic scanning every hour via cron jobs
- **Emergency Scans**: Triggered when dislikes reach 600

### 💾 Intelligent Management
- **Minimum 100 Active Servers** maintained at all times
- **Maximum 150 Selected Servers** for optimal quality
- **Auto-Addition**: If active servers drop below 100, 500 new servers are added automatically

### 👥 User Experience
- **View-Only Interface**: Users can only view and copy servers
- **Zero Impact**: No user operations affect the scanning process
- **Live Statistics**: Real-time system statistics display

### 🛡️ Advanced Features
- **SQLite Database**: Local storage for reliability
- **Quality Filtering**: Only high-performance servers are maintained
- **Latency Testing**: Automatic server performance evaluation
- **Multi-Source Scanning**: Scans from multiple V2Ray configuration sources

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Backend Setup

```bash
cd backend
npm run dev
```

The backend runs on port 3001 and automatically:
- Creates SQLite database
- Starts initial server scanning
- Schedules hourly automatic scans

### 3. Frontend Setup

```bash
# In the root directory
npm run dev
```

### 4. Concurrent Execution (Recommended)

```bash
npm start
```

This command runs both backend and frontend simultaneously.

### 5. Environment Configuration

Create a `.env` file in the backend directory:
```env
PORT=3001
DB_PATH=./data/servers.db
SCAN_INTERVAL=3600000
MIN_SERVERS=100
MAX_SERVERS=150
```

## 📁 Project Structure

```
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── server.js          # Main server application
│   │   ├── database.js        # Database management
│   │   ├── scanner.js         # Server scanning system
│   │   ├── utils/
│   │   │   ├── parser.js      # Configuration parser
│   │   │   └── serverTester.js # Server testing utilities
│   │   └── services/
│   │       └── serverService.js # Server management service
│   ├── data/                  # SQLite database storage
│   └── package.json
├── src/                       # React Frontend
│   ├── App.tsx               # Main application component
│   ├── components/           # React components
│   ├── services/
│   │   └── api.ts           # Backend API communication
│   └── styles/              # CSS styling files
├── components/               # Shared components
├── services/                # Shared services
└── package.json
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/servers` | Retrieve active servers |
| `GET` | `/api/stats` | Get system statistics |
| `POST` | `/api/servers/:id/dislike` | Register server dislike |
| `GET` | `/api/health` | Backend health check |

### API Response Examples

**GET /api/servers**
```json
{
  "success": true,
  "servers": [
    {
      "id": 1,
      "config": "vless://...",
      "latency": 45,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**GET /api/stats**
```json
{
  "totalServers": 150,
  "activeServers": 142,
  "lastScan": "2024-01-01T12:00:00Z",
  "nextScan": "2024-01-01T13:00:00Z"
}
```

## ⚙️ System Logic

### Automated Scanning Process
1. **Hourly Scans**: Regular scanning every hour
2. **Count Verification**: If active servers < 100, adds 500 new servers
3. **Maximum Management**: If selected servers > 150, removes oldest entries

### Emergency Scanning
- Dislike counts checked every 10 minutes
- Emergency scan triggered when dislikes reach 600
- Automatic server replacement and quality maintenance

### Server Selection Algorithm
- Only servers with `status: 'active'` are displayed
- Sorted by latency and connection quality
- Maximum 150 servers maintained at any time
- Automatic quality filtering and performance optimization

### Database Management
- SQLite for reliable local storage
- Automatic cleanup of inactive servers
- Performance metrics tracking
- Historical data retention for analytics

## ✨ Advantages & Benefits

### Architecture Benefits
1. **Complete Separation**: Independent backend and frontend architecture
2. **Scalability**: Multiple frontends can connect to a single backend
3. **Reliability**: Local database, no dependency on external resources
4. **Automation**: No manual intervention required
5. **Optimization**: Only high-quality servers are maintained

### Performance Features
- **Fast Response Times**: Local database ensures quick server retrieval
- **Efficient Scanning**: Multi-threaded server testing
- **Smart Caching**: Optimized data storage and retrieval
- **Resource Management**: Automatic cleanup and optimization

### User Benefits
- **Always Available**: Servers ready 24/7 without user action
- **High Quality**: Only tested and verified servers
- **Easy Access**: Simple copy-paste interface
- **Real-time Updates**: Live statistics and server status

## ⚠️ Important Notes

### System Independence
- ✅ **Autonomous Backend**: Scanning operates without user intervention
- ✅ **Refresh-Proof**: Page refresh doesn't trigger new scans
- ✅ **Close-Safe**: Closing the website doesn't affect backend operations
- ✅ **Observer Mode**: User operations have zero impact on scanning

### Technical Requirements
- Backend must always be running (it's the system's brain)
- Initial scan starts immediately after backend startup
- Database stored at `backend/data/servers.db`
- Complete logs displayed in backend console
- Requires stable internet connection for scanning

### Production Deployment
- Use process managers like PM2 for backend stability
- Configure reverse proxy (nginx) for production
- Set up SSL certificates for secure connections
- Monitor system resources and performance

## 🧪 Testing the System

After setup, you can test the system functionality:

### Backend API Testing:
```bash
# Get system statistics
curl http://localhost:3001/api/stats

# Get active servers
curl http://localhost:3001/api/servers

# Health check
curl http://localhost:3001/api/health
```

### Frontend Testing:
- Navigate to: http://localhost:8000
- Should display list of active servers
- Copy functionality for all servers
- Real-time statistics display

### Performance Testing:
```bash
# Load testing with curl
for i in {1..10}; do curl http://localhost:3001/api/servers & done

# Monitor backend logs for performance metrics
```

## 📊 Current Status

### ✅ Backend (Fully Implemented & Tested)
- SQLite database created and optimized
- 5 default sources configured
- Automatic scanning system active
- 150+ active servers in database
- RESTful API endpoints functional
- Cron job scheduling implemented

### ✅ Frontend (Updated for API Integration)
- Backend API connection established
- Active server display functionality
- Real-time statistics dashboard
- Server dislike functionality
- Responsive design implementation
- Copy-to-clipboard features

## 🔧 Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **node-cron** - Task scheduling
- **axios** - HTTP client

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CSS3** - Styling

## 🐛 Issues Resolved

1. **Complete Separation**: Frontend no longer depends on localStorage
2. **Automatic Scanning**: Hourly scans without user intervention
3. **Smart Management**: Server count automatically controlled
4. **Stability**: Local database, no internet dependency for display
5. **Scalability**: Multiple clients can connect to one backend

## 🚀 Future Enhancements

- [ ] Docker containerization
- [ ] Advanced server filtering options
- [ ] Performance analytics dashboard
- [ ] Multi-language support
- [ ] Mobile application
- [ ] Server location mapping

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mohammad Reza Abedin Poor**
- GitHub: [@MOHAMMADREZAABEDINPOOR](https://github.com/MOHAMMADREZAABEDINPOOR)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_PERSONAL/issues).

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!