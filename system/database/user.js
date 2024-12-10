import fs from 'fs/promises';
import path from 'path';

const userDbPath = path.join(process.cwd(), 'system', 'database', 'json', 'users.json');

export class UserDB {
  constructor() {
    this.users = {};
    this.load();
  }

  async load() {
    try {
      await fs.access(userDbPath);
      const data = await fs.readFile(userDbPath, 'utf8');
      this.users = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.save();
      } else {
        console.error('Error loading user database:', error);
      }
    }
  }

  async save() {
    try {
      await fs.mkdir(path.dirname(userDbPath), { recursive: true });
      await fs.writeFile(userDbPath, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving user database:', error);
    }
  }

  getUser(userId) {
    if (!this.users[userId]) {
      this.users[userId] = {
        exp: 0,
        level: 1,
        messageCount: 0,
        name: '',
        createdAt: new Date().toISOString()
      };
    }
    return this.users[userId];
  }

  async updateUser(userId, updateFn) {
    const user = this.getUser(userId);
    updateFn(user);
    user.updatedAt = new Date().toISOString();
    await this.save();
  }

  async addMessage(userId, userName) {
    let leveledUp = false;
    await this.updateUser(userId, (user) => {
      user.messageCount++;
      user.exp++;
      user.name = userName;
      if (user.messageCount >= 5 * Math.pow(2, user.level - 1)) {
        user.level++;
        user.messageCount = 0;
        leveledUp = true;
      }
    });
    return leveledUp;
  }

  getAllUserIds() {
    return Object.keys(this.users);
  }

  async deleteUser(userId) {
    if (this.users[userId]) {
      delete this.users[userId];
      await this.save();
    }
  }

  getUsersByLevel(level) {
    return Object.entries(this.users)
      .filter(([_, user]) => user.level === level)
      .map(([userId, user]) => ({ userId, ...user }));
  }

  getTopUsers(limit = 10) {
    return Object.entries(this.users)
      .sort(([_, a], [__, b]) => b.exp - a.exp)
      .slice(0, limit)
      .map(([userId, user]) => ({ userId, ...user }));
  }
}