import fs from 'fs/promises';
import path from 'path';

const groupDbPath = path.join(process.cwd(), 'system', 'database', 'json', 'groups.json');

export class GroupDB {
  constructor() {
    this.groups = {};
    this.load();
  }

  async load() {
    try {
      await fs.access(groupDbPath);
      const data = await fs.readFile(groupDbPath, 'utf8');
      this.groups = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.save();
      } else {
        console.error('Error loading group database:', error);
      }
    }
  }

  async save() {
    try {
      await fs.mkdir(path.dirname(groupDbPath), { recursive: true });
      await fs.writeFile(groupDbPath, JSON.stringify(this.groups, null, 2));
    } catch (error) {
      console.error('Error saving group database:', error);
    }
  }

  getGroup(groupId) {
    if (!this.groups[groupId]) {
      this.groups[groupId] = { 
        onlyadmin: false,
        createdAt: new Date().toISOString()
      };
      this.save(); // Auto-save when a new group is added
    }
    return this.groups[groupId];
  }

  async updateGroup(groupId, updateFn) {
    const group = this.getGroup(groupId);
    updateFn(group);
    group.updatedAt = new Date().toISOString(); // Add last updated timestamp
    await this.save();
  }

  async setOnlyAdmin(groupId, value) {
    await this.updateGroup(groupId, (group) => {
      group.onlyadmin = value;
    });
  }

  getAllGroupIds() {
    return Object.keys(this.groups);
  }

  async deleteGroup(groupId) {
    if (this.groups[groupId]) {
      delete this.groups[groupId];
      await this.save();
    }
  }
}