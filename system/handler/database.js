import { UserDB } from '../database/user.js';
import { GroupDB } from '../database/group.js';

export class Database {
  constructor() {
    this.u = new UserDB();
    this.g = new GroupDB();
  }

  // User methods
  async rankUp(userId, userName) {
    const leveledUp = await this.u.addMessage(userId, userName);
    if (leveledUp) {
      const user = this.u.getUser(userId);
      return user;
    }
    return null;
  }

  getUser(userId) {
    return this.u.getUser(userId);
  }

  updateUser(userId, updateFn) {
    return this.u.updateUser(userId, updateFn);
  }

  addMessage(userId, userName) {
    return this.u.addMessage(userId, userName);
  }

  getAllUserIds() {
    return this.u.getAllUserIds();
  }

  deleteUser(userId) {
    return this.u.deleteUser(userId);
  }

  getUsersByLevel(level) {
    return this.u.getUsersByLevel(level);
  }

  getTopUsers(limit) {
    return this.u.getTopUsers(limit);
  }

  // Group methods
  async setOnlyAdmin(groupId, value) {
    await this.g.setOnlyAdmin(groupId, value);
  }

  getGroup(groupId) {
    return this.g.getGroup(groupId);
  }

  updateGroup(groupId, updateFn) {
    return this.g.updateGroup(groupId, updateFn);
  }

  getAllGroupIds() {
    return this.g.getAllGroupIds();
  }

  deleteGroup(groupId) {
    return this.g.deleteGroup(groupId);
  }

  // Database methods
  async load() {
    await this.u.load();
    await this.g.load();
  }

  async save() {
    await this.u.save();
    await this.g.save();
  }
}