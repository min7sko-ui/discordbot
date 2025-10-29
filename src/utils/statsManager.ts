import * as fs from 'fs';
import * as path from 'path';
import { StatsData, TicketData, TicketStatus } from '../types/index.js';
import { TicketManager } from './ticketManager.js';

export class StatsManager {
  private static dataFile = path.join(process.cwd(), 'data', 'stats.json');

  public static calculateStats(): StatsData {
    const allTickets = TicketManager.getAllTickets();
    const openTickets = allTickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.CLAIMED);
    const closedTickets = allTickets.filter(t => t.status === TicketStatus.CLOSED);

    const stats: StatsData = {
      totalTickets: allTickets.length,
      openTickets: openTickets.length,
      closedTickets: closedTickets.length,
      avgResponseTime: this.calculateAvgResponseTime(closedTickets),
      avgResolutionTime: this.calculateAvgResolutionTime(closedTickets),
      avgRating: this.calculateAvgRating(closedTickets),
      ticketsByCategory: this.getTicketsByCategory(allTickets),
      ticketsByStaff: this.getTicketsByStaff(allTickets),
      ratingDistribution: this.getRatingDistribution(closedTickets),
    };

    this.saveStats(stats);
    return stats;
  }

  private static calculateAvgResponseTime(tickets: TicketData[]): number {
    if (tickets.length === 0) return 0;

    let totalResponseTime = 0;
    let count = 0;

    for (const ticket of tickets) {
      if (ticket.messages.length >= 2) {
        const firstUserMessage = ticket.messages[0];
        const firstStaffMessage = ticket.messages.find(m => m.authorId !== ticket.userId);
        
        if (firstStaffMessage) {
          totalResponseTime += firstStaffMessage.timestamp - firstUserMessage.timestamp;
          count++;
        }
      }
    }

    return count > 0 ? Math.floor(totalResponseTime / count / 1000 / 60) : 0; // Return in minutes
  }

  private static calculateAvgResolutionTime(tickets: TicketData[]): number {
    if (tickets.length === 0) return 0;

    let totalTime = 0;
    let count = 0;

    for (const ticket of tickets) {
      if (ticket.status === TicketStatus.CLOSED && ticket.createdAt) {
        const closedTime = ticket.lastActivity || Date.now();
        totalTime += closedTime - ticket.createdAt;
        count++;
      }
    }

    return count > 0 ? Math.floor(totalTime / count / 1000 / 60 / 60) : 0; // Return in hours
  }

  private static calculateAvgRating(tickets: TicketData[]): number {
    const ratedTickets = tickets.filter(t => t.rating !== undefined);
    if (ratedTickets.length === 0) return 0;

    const totalRating = ratedTickets.reduce((sum, t) => sum + (t.rating || 0), 0);
    return Math.round((totalRating / ratedTickets.length) * 10) / 10;
  }

  private static getTicketsByCategory(tickets: TicketData[]): { [key: string]: number } {
    const categories: { [key: string]: number } = {};

    for (const ticket of tickets) {
      categories[ticket.category] = (categories[ticket.category] || 0) + 1;
    }

    return categories;
  }

  private static getTicketsByStaff(tickets: TicketData[]): { [key: string]: number } {
    const staff: { [key: string]: number } = {};

    for (const ticket of tickets) {
      if (ticket.claimedByUsername) {
        staff[ticket.claimedByUsername] = (staff[ticket.claimedByUsername] || 0) + 1;
      }
    }

    return staff;
  }

  private static getRatingDistribution(tickets: TicketData[]): { [key: number]: number } {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const ticket of tickets) {
      if (ticket.rating) {
        distribution[ticket.rating]++;
      }
    }

    return distribution;
  }

  public static getTopStaff(): { username: string; count: number } | null {
    const stats = this.calculateStats();
    const staffEntries = Object.entries(stats.ticketsByStaff);

    if (staffEntries.length === 0) return null;

    const [username, count] = staffEntries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );

    return { username, count };
  }

  public static getBusiestCategory(): { category: string; count: number } | null {
    const stats = this.calculateStats();
    const categoryEntries = Object.entries(stats.ticketsByCategory);

    if (categoryEntries.length === 0) return null;

    const [category, count] = categoryEntries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );

    return { category, count };
  }

  private static saveStats(stats: StatsData): void {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  public static loadStats(): StatsData | null {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    return null;
  }
}
