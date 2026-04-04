import type { Node, Edge } from "reactflow";
import type { LucideIcon } from "lucide-react";
import {
    Inbox,
    GitBranch,
    Zap,
    Eye,
    Send,
    FileText,
    Truck,
    AlertTriangle,
    UserCheck,
    BookOpen,
    MessageSquare,
} from "lucide-react";

export type NodeCategory =
    | "ingest"
    | "triage"
    | "resolve"
    | "review"
    | "output"
    | "policy"
    | "logistics"
    | "escalation"
    | "human"
    | "knowledge"
    | "feedback";

export type NodeStatus = "configured" | "needs-setup" | "active";

export interface WorkflowNodeData {
    label: string;
    description: string;
    category: NodeCategory;
    status: NodeStatus;
    config: Record<string, unknown>;
}

export type NodeCategoryMeta = {
    label: string;
    color: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    icon: LucideIcon;
    description: string;
};

export const NODE_CATEGORIES: Record<NodeCategory, NodeCategoryMeta> = {
    ingest: {
        label: "Ingest",
        color: "hsl(217, 91%, 60%)",
        colorClass: "text-node-ingest",
        bgClass: "bg-blue-50",
        borderClass: "border-node-ingest",
        icon: Inbox,
        description: "Where messages come in",
    },
    triage: {
        label: "Triage",
        color: "hsl(263, 70%, 58%)",
        colorClass: "text-node-triage",
        bgClass: "bg-violet-50",
        borderClass: "border-node-triage",
        icon: GitBranch,
        description: "Sort and classify messages",
    },
    resolve: {
        label: "Resolve",
        color: "hsl(173, 58%, 39%)",
        colorClass: "text-node-resolve",
        bgClass: "bg-teal-50",
        borderClass: "border-node-resolve",
        icon: Zap,
        description: "AI generates a response",
    },
    review: {
        label: "Review",
        color: "hsl(38, 92%, 50%)",
        colorClass: "text-node-review",
        bgClass: "bg-amber-50",
        borderClass: "border-node-review",
        icon: Eye,
        description: "Human reviews the draft",
    },
    output: {
        label: "Output",
        color: "hsl(239, 84%, 67%)",
        colorClass: "text-node-output",
        bgClass: "bg-indigo-50",
        borderClass: "border-node-output",
        icon: Send,
        description: "Send the final reply",
    },
    policy: {
        label: "Policy Context",
        color: "hsl(142, 71%, 45%)",
        colorClass: "text-node-policy",
        bgClass: "bg-green-50",
        borderClass: "border-node-policy",
        icon: FileText,
        description: "Apply business policies",
    },
    logistics: {
        label: "Logistics",
        color: "hsl(199, 89%, 48%)",
        colorClass: "text-node-logistics",
        bgClass: "bg-sky-50",
        borderClass: "border-node-logistics",
        icon: Truck,
        description: "Check delivery and operations",
    },
    escalation: {
        label: "Escalation",
        color: "hsl(0, 72%, 51%)",
        colorClass: "text-node-escalation",
        bgClass: "bg-red-50",
        borderClass: "border-node-escalation",
        icon: AlertTriangle,
        description: "Escalate critical issues",
    },
    human: {
        label: "Human Override",
        color: "hsl(25, 95%, 53%)",
        colorClass: "text-node-human",
        bgClass: "bg-orange-50",
        borderClass: "border-node-human",
        icon: UserCheck,
        description: "A human takes over fully",
    },
    knowledge: {
        label: "Knowledge Base",
        color: "hsl(262, 83%, 58%)",
        colorClass: "text-node-knowledge",
        bgClass: "bg-purple-50",
        borderClass: "border-node-knowledge",
        icon: BookOpen,
        description: "Look up knowledge articles",
    },
    feedback: {
        label: "Feedback",
        color: "hsl(173, 58%, 39%)",
        colorClass: "text-node-feedback",
        bgClass: "bg-teal-50",
        borderClass: "border-node-feedback",
        icon: MessageSquare,
        description: "Collect customer feedback",
    },
};

export type WorkflowTemplate = {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
};

export const SMALL_BUSINESS_TEMPLATE: WorkflowTemplate = {
    nodes: [
        {
            id: "1",
            type: "workflow",
            position: { x: 100, y: 200 },
            data: {
                label: "Ingest",
                description: "Messages come in via WhatsApp, email, or forms",
                category: "ingest",
                status: "configured",
                config: {},
            },
        },
        {
            id: "2",
            type: "workflow",
            position: { x: 380, y: 200 },
            data: {
                label: "Triage",
                description: "AI sorts by category and urgency",
                category: "triage",
                status: "configured",
                config: {},
            },
        },
        {
            id: "3",
            type: "workflow",
            position: { x: 660, y: 200 },
            data: {
                label: "Resolve",
                description: "AI drafts a response",
                category: "resolve",
                status: "needs-setup",
                config: {},
            },
        },
        {
            id: "4",
            type: "workflow",
            position: { x: 940, y: 200 },
            data: {
                label: "Review",
                description: "Your team reviews before sending",
                category: "review",
                status: "needs-setup",
                config: {},
            },
        },
        {
            id: "5",
            type: "workflow",
            position: { x: 1220, y: 200 },
            data: {
                label: "Output",
                description: "Reply is sent to the customer",
                category: "output",
                status: "configured",
                config: {},
            },
        },
    ],
    edges: [
        {
            id: "e1-2",
            source: "1",
            target: "2",
            animated: true,
            style: { stroke: "hsl(217, 91%, 60%)" },
        },
        {
            id: "e2-3",
            source: "2",
            target: "3",
            animated: true,
            style: { stroke: "hsl(263, 70%, 58%)" },
        },
        {
            id: "e3-4",
            source: "3",
            target: "4",
            animated: true,
            style: { stroke: "hsl(173, 58%, 39%)" },
        },
        {
            id: "e4-5",
            source: "4",
            target: "5",
            animated: true,
            style: { stroke: "hsl(38, 92%, 50%)" },
        },
    ],
};

export const MSME_TEMPLATE: WorkflowTemplate = {
    nodes: [
        {
            id: "1",
            type: "workflow",
            position: { x: 100, y: 100 },
            data: {
                label: "Ingest",
                description: "Messages from all channels",
                category: "ingest",
                status: "configured",
                config: {},
            },
        },
        {
            id: "2",
            type: "workflow",
            position: { x: 380, y: 100 },
            data: {
                label: "Triage",
                description: "Classify and route messages",
                category: "triage",
                status: "configured",
                config: {},
            },
        },
        {
            id: "3",
            type: "workflow",
            position: { x: 660, y: 30 },
            data: {
                label: "Policy Context",
                description: "Check against business policies",
                category: "policy",
                status: "needs-setup",
                config: {},
            },
        },
        {
            id: "4",
            type: "workflow",
            position: { x: 660, y: 200 },
            data: {
                label: "Logistics",
                description: "Check delivery status",
                category: "logistics",
                status: "needs-setup",
                config: {},
            },
        },
        {
            id: "5",
            type: "workflow",
            position: { x: 940, y: 100 },
            data: {
                label: "Resolve",
                description: "AI drafts a response",
                category: "resolve",
                status: "needs-setup",
                config: {},
            },
        },
        {
            id: "6",
            type: "workflow",
            position: { x: 1220, y: 30 },
            data: {
                label: "Critical Review",
                description: "Human reviews critical cases",
                category: "review",
                status: "needs-setup",
                config: {},
            },
        },
        {
            id: "7",
            type: "workflow",
            position: { x: 1220, y: 200 },
            data: {
                label: "Human Override",
                description: "Full human takeover",
                category: "human",
                status: "needs-setup",
                config: {},
            },
        },
        {
            id: "8",
            type: "workflow",
            position: { x: 1500, y: 100 },
            data: {
                label: "Output",
                description: "Send the final reply",
                category: "output",
                status: "configured",
                config: {},
            },
        },
        {
            id: "9",
            type: "workflow",
            position: { x: 1500, y: 280 },
            data: {
                label: "Feedback",
                description: "Collect customer feedback",
                category: "feedback",
                status: "needs-setup",
                config: {},
            },
        },
    ],
    edges: [
        { id: "e1-2", source: "1", target: "2", animated: true },
        { id: "e2-3", source: "2", target: "3", animated: true },
        { id: "e2-4", source: "2", target: "4", animated: true },
        { id: "e3-5", source: "3", target: "5", animated: true },
        { id: "e4-5", source: "4", target: "5", animated: true },
        { id: "e5-6", source: "5", target: "6", animated: true },
        { id: "e5-7", source: "5", target: "7", animated: true },
        { id: "e6-8", source: "6", target: "8", animated: true },
        { id: "e7-8", source: "7", target: "8", animated: true },
        { id: "e8-9", source: "8", target: "9", animated: true },
    ],
};

export const NODE_LIBRARY: { category: NodeCategory; items: { label: string; description: string }[] }[] = [
    {
        category: "ingest",
        items: [
            { label: "WhatsApp Inbox", description: "Receive WhatsApp messages" },
            { label: "Email Inbox", description: "Receive customer emails" },
            { label: "Web Form", description: "Capture form submissions" },
        ],
    },
    {
        category: "triage",
        items: [
            { label: "Auto Classifier", description: "AI sorts by topic and urgency" },
            { label: "Sentiment Filter", description: "Detect angry or happy messages" },
        ],
    },
    {
        category: "resolve",
        items: [
            { label: "AI Responder", description: "Generate a draft reply" },
            { label: "Template Match", description: "Find the best template reply" },
        ],
    },
    {
        category: "review",
        items: [
            { label: "Team Review", description: "Your team reviews AI drafts" },
            { label: "Manager Approval", description: "Require manager sign-off" },
        ],
    },
    {
        category: "output",
        items: [
            { label: "Send Reply", description: "Send via original channel" },
            { label: "Notify Team", description: "Alert your team via Slack or email" },
        ],
    },
    {
        category: "policy",
        items: [
            { label: "Policy Check", description: "Validate against business rules" },
        ],
    },
    {
        category: "logistics",
        items: [
            { label: "Order Lookup", description: "Check shipping and order status" },
        ],
    },
    {
        category: "escalation",
        items: [
            { label: "Urgent Escalation", description: "Flag for immediate attention" },
        ],
    },
    {
        category: "human",
        items: [
            { label: "Human Takeover", description: "A person handles it directly" },
        ],
    },
    {
        category: "knowledge",
        items: [
            { label: "FAQ Search", description: "Search your knowledge base" },
        ],
    },
    {
        category: "feedback",
        items: [
            { label: "Collect Feedback", description: "Ask the customer for feedback" },
        ],
    },
];
