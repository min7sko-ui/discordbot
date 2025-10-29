import * as fs from 'fs';
import { User } from 'discord.js';
import chalk from 'chalk';

interface BlacklistEntry {
  userId: string;
  userName: string;
  reason: string;
  timestamp: string;
}

interface BlacklistDatabase {
  [userId: string]: BlacklistEntry;
}

export class BlacklistManager {
  private static blacklistPath = 'data/blacklist.json';

  private static loadBlacklist(): BlacklistDatabase {
    try {
      if (!fs.existsSync(this.blacklistPath)) {
        fs.writeFileSync(this.blacklistPath, '{}');
      }
      const data = fs.readFileSync(this.blacklistPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(chalk.red('❌ Error loading blacklist:'), error);
      return {};
    }
  }

  private static saveBlacklist(blacklist: BlacklistDatabase): void {
    try {
      fs.writeFileSync(this.blacklistPath, JSON.stringify(blacklist, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ Error saving blacklist:'), error);
    }
  }

  static addUser(user: User, reason: string = 'No reason provided'): void {
    const blacklist = this.loadBlacklist();
    
    blacklist[user.id] = {
      userId: user.id,
      userName: user.tag,
      reason,
      timestamp: new Date().toISOString(),
    };

    this.saveBlacklist(blacklist);
    console.log(chalk.green(`✅ User ${user.tag} added to blacklist`));
  }

  static removeUser(userId: string): boolean {
    const blacklist = this.loadBlacklist();
    
    if (blacklist[userId]) {
      delete blacklist[userId];
      this.saveBlacklist(blacklist);
      console.log(chalk.green(`✅ User removed from blacklist`));
      return true;
    }
    
    return false;
  }

  static isBlacklisted(userId: string): boolean {
    const blacklist = this.loadBlacklist();
    return userId in blacklist;
  }

  static getBlacklist(): BlacklistDatabase {
    return this.loadBlacklist();
  }

  static getEntry(userId: string): BlacklistEntry | null {
    const blacklist = this.loadBlacklist();
    return blacklist[userId] || null;
  }
}
