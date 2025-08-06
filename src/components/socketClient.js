
// frontend/socketClient.js
import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.heartbeatInterval = null;
    this.onlineUsers = new Set();
    this.userStatusCallbacks = new Map();
  }

  // ✅ Connect and authenticate
  connect(token) {
    this.socket = io('http://localhost:5000', {
      autoConnect: false
    });

    this.socket.connect();

    // Authenticate immediately after connection
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.socket.emit('authenticate', token);
    });

    // Handle authentication response
    this.socket.on('authenticated', (data) => {
      if (data.success) {
        console.log('Authenticated successfully');
        this.startHeartbeat();
        this.setupEventListeners();
      }
    });

    this.socket.on('authentication_error', (error) => {
      console.error('Authentication failed:', error.message);
    });
  }

  // ✅ Start heartbeat
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('heartbeat');
      }
    }, 30000); // Every 30 seconds
  }

  // ✅ Setup event listeners
  setupEventListeners() {
    // User came online
    this.socket.on('user_online', (data) => {
      console.log('User came online:', data);
      this.onlineUsers.add(data.userId);
      this.notifyStatusChange(data.userId, true, data.lastSeen);
    });

    // User went offline
    this.socket.on('user_offline', (data) => {
      console.log('User went offline:', data);
      this.onlineUsers.delete(data.userId);
      this.notifyStatusChange(data.userId, false, data.lastSeen);
    });

    // Online users list
    this.socket.on('online_users_list', (users) => {
      this.onlineUsers.clear();
      users.forEach(user => {
        if (user.onlineStatus?.isOnline) {
          this.onlineUsers.add(user._id);
        }
      });
      console.log('Online users:', users);
    });

    // Bulk users status
    this.socket.on('users_status', (users) => {
      users.forEach(user => {
        const isOnline = user.onlineStatus?.isOnline || false;
        const lastSeen = user.onlineStatus?.lastSeen;
        this.notifyStatusChange(user._id, isOnline, lastSeen);
      });
    });
  }

  // ✅ Get online users
  getOnlineUsers() {
    if (this.socket) {
      this.socket.emit('get_online_users');
    }
  }

  // ✅ Get specific users status
  getUsersStatus(userIds) {
    if (this.socket && userIds.length > 0) {
      this.socket.emit('get_users_status', userIds);
    }
  }

  // ✅ Subscribe to user status changes
  onUserStatusChange(userId, callback) {
    if (!this.userStatusCallbacks.has(userId)) {
      this.userStatusCallbacks.set(userId, []);
    }
    this.userStatusCallbacks.get(userId).push(callback);
  }

  // ✅ Notify status change
  notifyStatusChange(userId, isOnline, lastSeen) {
    if (this.userStatusCallbacks.has(userId)) {
      this.userStatusCallbacks.get(userId).forEach(callback => {
        callback({ userId, isOnline, lastSeen });
      });
    }
  }

  // ✅ Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  // ✅ Disconnect
  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// ✅ Usage example
const socketManager = new SocketManager();

// Connect with JWT token
const token = localStorage.getItem('authToken');
socketManager.connect(token);

// Get online users on page load
socketManager.getOnlineUsers();

// Subscribe to specific user status
socketManager.onUserStatusChange('user123', ({ userId, isOnline, lastSeen }) => {
  console.log(`User ${userId} is ${isOnline ? 'online' : 'offline'}`);
  if (!isOnline) {
    console.log(`Last seen: ${new Date(lastSeen).toLocaleString()}`);
  }
});

// Get status for chat participants
const chatParticipants = ['user1', 'user2', 'user3'];
socketManager.getUsersStatus(chatParticipants);

export default socketManager;
