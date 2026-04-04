export type TicketSource = "whatsapp" | "email" | "form";
export type TicketUrgency = "low" | "medium" | "high" | "critical";
export type TicketStatus = "needs-review" | "approved" | "rejected" | "escalated";
export type TicketSentiment = "positive" | "neutral" | "negative";

export interface ReviewTicket {
    id: string;
    owner_uid: string;
    customer_name: string;
    source: TicketSource;
    category: string;
    urgency: TicketUrgency;
    confidence: number;
    preview: string;
    message: string;
    ai_draft: string;
    sentiment: TicketSentiment;
    language: string;
    status: TicketStatus;
    received_at: string;
    ai_category: string;
    context_used: string[];
    response_time_minutes: number | null;
    created_at: string;
    updated_at: string;
}

export interface AnalyticsPayload {
    avgResponseTime: string;
    ticketsProcessed: number;
    aiDraftRate: number;
    approvalRate: number;
    escalationRate: number;
    confidenceTrend: { day: string; confidence: number; tickets: number }[];
    categoryBreakdown: { name: string; value: number }[];
    responseTimeHistory: { day: string; time: number }[];
}
