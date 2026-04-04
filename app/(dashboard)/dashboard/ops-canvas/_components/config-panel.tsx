"use client";

import { useMemo, useState } from "react";
import { X, Sparkles, ChevronDown } from "lucide-react";
import type { NodeCategory, WorkflowNodeData } from "@/lib/ops-canvas/workflow-types";
import { NODE_CATEGORIES } from "@/lib/ops-canvas/workflow-types";
import { Button } from "@/components/ui/button";

interface ConfigPanelProps {
    nodeId: string;
    nodeData: WorkflowNodeData;
    onClose: () => void;
    onUpdateConfig: (nodeId: string, key: string, value: unknown) => void;
}

type ConfigField = {
    key: string;
    label: string;
    type: "input" | "select" | "switch" | "textarea";
    options?: string[];
    placeholder?: string;
};

const CONFIG_FIELDS: Record<NodeCategory, { fields: ConfigField[] }> = {
    ingest: {
        fields: [
            { key: "channelType", label: "Channel Type", type: "select", options: ["WhatsApp", "Email", "Web Form", "API"] },
            { key: "sourceName", label: "Source Name", type: "input", placeholder: "e.g. Main WhatsApp Line" },
            { key: "enableChannel", label: "Enable Channel", type: "switch" },
            { key: "fallbackRoute", label: "Fallback Route", type: "select", options: ["Queue", "Direct to Human", "Auto-reject"] },
        ],
    },
    triage: {
        fields: [
            { key: "categories", label: "Categories", type: "input", placeholder: "Orders, Billing, Returns" },
            { key: "urgencyRules", label: "Urgency Rules", type: "select", options: ["AI Auto-detect", "Keyword-based", "Manual"] },
            { key: "sentimentSensitivity", label: "Sentiment Sensitivity", type: "select", options: ["Low", "Medium", "High"] },
            { key: "languageDetection", label: "Language Detection", type: "switch" },
            { key: "escalationKeywords", label: "Escalation Keywords", type: "input", placeholder: "legal, fraud, urgent" },
        ],
    },
    resolve: {
        fields: [
            { key: "useKnowledgeBase", label: "Use Knowledge Base", type: "switch" },
            { key: "replyTone", label: "Reply Tone", type: "select", options: ["Friendly", "Professional", "Empathetic", "Formal"] },
            { key: "confidenceThreshold", label: "Confidence Threshold", type: "select", options: ["70%", "80%", "90%", "95%"] },
            { key: "contextMemory", label: "Context Memory", type: "switch" },
        ],
    },
    review: {
        fields: [
            { key: "reviewRequired", label: "Review Required", type: "switch" },
            { key: "assignedTeam", label: "Assigned Team", type: "input", placeholder: "Support Team A" },
            { key: "approvalPriority", label: "Approval Priority", type: "select", options: ["All tickets", "High urgency only", "Low confidence only"] },
            { key: "humanEscalation", label: "Human Escalation", type: "switch" },
        ],
    },
    output: {
        fields: [
            { key: "outputChannel", label: "Output Channel", type: "select", options: ["Same as input", "WhatsApp", "Email", "SMS"] },
            { key: "deliveryConfirmation", label: "Delivery Confirmation", type: "switch" },
            { key: "notifyTeam", label: "Notify Team", type: "switch" },
        ],
    },
    policy: {
        fields: [
            { key: "policySource", label: "Policy Source", type: "select", options: ["Uploaded docs", "Knowledge base", "Manual rules"] },
            { key: "applyToCategories", label: "Apply To Categories", type: "input", placeholder: "Returns, Refunds, Warranty" },
            { key: "confidenceRule", label: "Confidence Rule", type: "select", options: ["Strict", "Moderate", "Flexible"] },
        ],
    },
    logistics: {
        fields: [
            { key: "dataSource", label: "Data Source", type: "select", options: ["Shopify", "WooCommerce", "Manual", "API"] },
            { key: "escalateDelayed", label: "Escalate If Delayed", type: "switch" },
            { key: "notifyLogistics", label: "Notify Logistics Team", type: "switch" },
        ],
    },
    escalation: {
        fields: [
            { key: "triggerConditions", label: "Trigger Conditions", type: "select", options: ["Critical urgency", "Negative sentiment", "Keyword match"] },
            { key: "assignedHuman", label: "Assigned Human", type: "input", placeholder: "Manager name or team" },
            { key: "severity", label: "Severity", type: "select", options: ["High", "Critical", "Emergency"] },
        ],
    },
    human: {
        fields: [
            { key: "humanTrigger", label: "Trigger Conditions", type: "select", options: ["Always", "Low confidence", "Escalated"] },
            { key: "humanAssignee", label: "Assigned Human", type: "input", placeholder: "Team member name" },
            { key: "humanSeverity", label: "Severity", type: "select", options: ["Normal", "High", "Critical"] },
            { key: "overrideReason", label: "Override Reason", type: "textarea", placeholder: "Why should this go to a human?" },
        ],
    },
    knowledge: {
        fields: [
            { key: "knowledgeSource", label: "Source", type: "select", options: ["FAQ Database", "Uploaded docs", "Website crawl"] },
            { key: "autoUpdate", label: "Auto-update", type: "switch" },
        ],
    },
    feedback: {
        fields: [
            { key: "collectFeedback", label: "Collect Feedback", type: "switch" },
            { key: "feedbackChannel", label: "Feedback Channel", type: "select", options: ["Same channel", "Email", "SMS"] },
        ],
    },
};

function ToggleSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
                checked ? "bg-primary" : "bg-muted"
            }`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-5" : "translate-x-0.5"
                }`}
            />
        </button>
    );
}

export default function ConfigPanel({
    nodeId,
    nodeData,
    onClose,
    onUpdateConfig,
}: ConfigPanelProps) {
    const meta = NODE_CATEGORIES[nodeData.category];
    const Icon = meta.icon;
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const fields = useMemo(() => CONFIG_FIELDS[nodeData.category].fields, [nodeData.category]);

    return (
        <div className="w-80 bg-card border-l flex flex-col h-full animate-slide-in-right">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${meta.bgClass}`}>
                        <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-foreground">{nodeData.label}</h3>
                        <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                    {nodeData.description}
                </div>

                {fields.map((field) => {
                    const value = nodeData.config[field.key];
                    return (
                        <div key={field.key}>
                            <label className="text-xs font-medium text-muted-foreground">
                                {field.label}
                            </label>
                            {field.type === "input" && (
                                <input
                                    className="mt-1 h-9 w-full rounded-lg border border-input bg-white px-3 text-sm"
                                    placeholder={field.placeholder}
                                    value={typeof value === "string" ? value : ""}
                                    onChange={(event) => onUpdateConfig(nodeId, field.key, event.target.value)}
                                />
                            )}
                            {field.type === "textarea" && (
                                <textarea
                                    className="mt-1 min-h-[70px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                                    placeholder={field.placeholder}
                                    value={typeof value === "string" ? value : ""}
                                    onChange={(event) => onUpdateConfig(nodeId, field.key, event.target.value)}
                                />
                            )}
                            {field.type === "select" && (
                                <select
                                    className="mt-1 h-9 w-full rounded-lg border border-input bg-white px-3 text-sm"
                                    value={typeof value === "string" ? value : ""}
                                    onChange={(event) => onUpdateConfig(nodeId, field.key, event.target.value)}
                                >
                                    <option value="">Choose...</option>
                                    {field.options?.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {field.type === "switch" && (
                                <div className="mt-1">
                                    <ToggleSwitch
                                        checked={Boolean(value)}
                                        onChange={(nextValue) => onUpdateConfig(nodeId, field.key, nextValue)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Tell AI what you want this node to do
                    </label>
                    <textarea
                        className="mt-1 min-h-[80px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                        placeholder="e.g. When a customer asks about returns, check if the order is within 15 days and respond accordingly..."
                        value={typeof nodeData.config.aiNotes === "string" ? nodeData.config.aiNotes : ""}
                        onChange={(event) => onUpdateConfig(nodeId, "aiNotes", event.target.value)}
                    />
                </div>

                <div className="rounded-xl border border-border">
                    <button
                        type="button"
                        onClick={() => setAdvancedOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium"
                    >
                        Advanced Settings
                        <ChevronDown
                            className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                        />
                    </button>
                    {advancedOpen && (
                        <div className="px-3 pb-3 space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Timeout (seconds)</label>
                                <input
                                    className="mt-1 h-8 w-full rounded-lg border border-input bg-white px-2 text-sm"
                                    value={typeof nodeData.config.timeout === "string" ? nodeData.config.timeout : "30"}
                                    onChange={(event) => onUpdateConfig(nodeId, "timeout", event.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground">Retry on failure</label>
                                <ToggleSwitch
                                    checked={Boolean(nodeData.config.retryOnFailure)}
                                    onChange={(value) => onUpdateConfig(nodeId, "retryOnFailure", value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
