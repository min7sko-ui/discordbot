export interface TicketData {
  ticketId: string;
  channelId: string;
  guildId: string;
  embedMessageId?: string;
  userId: string;
  username: string;
  category: string;
  panelNumber: number;
  categoryIndex: number;
  createdAt: number;
  claimedBy?: string;
  claimedByUsername?: string;
  priority: TicketPriority;
  tags: string[];
  status: TicketStatus;
  messages: TicketMessage[];
  lastActivity: number;
  inactivityWarned?: boolean;
  rating?: number;
  feedbackText?: string;
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  CLAIMED = 'claimed',
  CLOSED = 'closed',
  DELETED = 'deleted',
}

export interface TicketMessage {
  authorId: string;
  authorUsername: string;
  content: string;
  timestamp: number;
  attachments?: string[];
}

export interface LogEntry {
  timestamp: number;
  type: LogType;
  ticketId?: string;
  userId: string;
  username: string;
  details: string;
  metadata?: any;
}

export enum LogType {
  TICKET_CREATED = 'ticket_created',
  TICKET_CLOSED = 'ticket_closed',
  TICKET_REOPENED = 'ticket_reopened',
  TICKET_DELETED = 'ticket_deleted',
  TICKET_CLAIMED = 'ticket_claimed',
  TICKET_UNCLAIMED = 'ticket_unclaimed',
  PRIORITY_CHANGED = 'priority_changed',
  TAG_ADDED = 'tag_added',
  TAG_REMOVED = 'tag_removed',
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  RATING_SUBMITTED = 'rating_submitted',
}

export interface StatsData {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  avgRating: number;
  ticketsByCategory: { [key: string]: number };
  ticketsByStaff: { [key: string]: number };
  ratingDistribution: { [key: number]: number };
}

export interface Config {
  token: string;
  guild_id: string;
  staff_roles: string[];
  ticket_category_id: string;
  feedback_channel_id: string;
  transcript_channel_id: string;
  log_channel_id?: string;
  
  // Branding & Appearance
  embed_color: string;
  footer_text: string;
  bot_name: string;
  thumbnail_url?: string;
  banner_url?: string;
  
  // Language
  language: string;
  
  // Features
  features: {
    ai_responses: boolean;
    auto_close: boolean;
    working_hours: boolean;
    ticket_reviews: boolean;
    transcripts: boolean;
    addons: boolean;
  };
  
  // Automation
  automation: {
    inactivity_timeout: number; // minutes
    inactivity_warning: number; // minutes before timeout
    staff_reminder_timeout: number; // minutes
    max_tickets_per_user: number;
    ticket_overload_limit: number;
  };
  
  // Working Hours
  working_hours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      monday: { start: string; end: string; enabled: boolean };
      tuesday: { start: string; end: string; enabled: boolean };
      wednesday: { start: string; end: string; enabled: boolean };
      thursday: { start: string; end: string; enabled: boolean };
      friday: { start: string; end: string; enabled: boolean };
      saturday: { start: string; end: string; enabled: boolean };
      sunday: { start: string; end: string; enabled: boolean };
    };
  };
  
  // Transcripts
  transcripts: {
    format: 'html' | 'txt' | 'both';
    send_to_user: boolean;
    send_to_staff_log: boolean;
    include_attachments: boolean;
  };
  
  // AI Settings
  ai: {
    enabled: boolean;
    provider?: string;
    api_key?: string;
    model?: string;
    auto_respond_delay?: number;
  };
  
  // Priority Colors
  priority_colors: {
    low: string;
    medium: string;
    high: string;
    urgent: string;
  };
  
  // Custom Tags
  available_tags: string[];
  
  // Messages
  blacklist_message?: string;
  close_ticket_message?: string;
  ticket_created_message?: string;
  feedback_prompt_message?: string;
}

export interface PanelCategory {
  label: string;
  description: string;
  emoji: string;
  modal: {
    title: string;
    questions: ModalQuestion[];
  };
}

export interface ModalQuestion {
  label: string;
  style: 'short' | 'paragraph';
  required: boolean;
  placeholder?: string;
  min_length?: number;
  max_length?: number;
}

export interface Panel {
  title: string;
  description: string;
  color: string;
  footer: string;
  emoji: string;
  thumbnail?: string;
  image?: string;
  author?: {
    name: string;
    icon_url?: string;
  };
  categories: PanelCategory[];
}

export interface Panels {
  panels: {
    [key: number]: Panel;
  };
}
