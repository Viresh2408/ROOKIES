"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft,
    Zap,
    Clock,
    Inbox,
    Brain,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import type { AnalyticsPayload } from "@/types";
import { toast } from "sonner";

const COLORS = [
    "hsl(217, 91%, 60%)",
    "hsl(263, 70%, 58%)",
    "hsl(173, 58%, 39%)",
    "hsl(38, 92%, 50%)",
    "hsl(0, 72%, 51%)",
    "hsl(199, 89%, 48%)",
];

export default function AnalyticsPage() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsPayload | null>(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const res = await fetch("/api/ops-canvas/analytics");
                const payload = await res.json();
                if (!res.ok) {
                    throw new Error(payload?.error || "Failed to load analytics");
                }
                setData(payload);
            } catch {
                toast.error("Unable to load analytics");
            }
        };

        loadAnalytics();
    }, []);

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
                Loading analytics...
            </div>
        );
    }

    const stats = [
        {
            label: "Avg Response Time",
            value: data.avgResponseTime,
            icon: Clock,
            color: "text-blue-500",
            bg: "bg-blue-50",
        },
        {
            label: "Tickets Processed",
            value: data.ticketsProcessed.toLocaleString(),
            icon: Inbox,
            color: "text-violet-500",
            bg: "bg-violet-50",
        },
        {
            label: "AI Draft Rate",
            value: `${data.aiDraftRate}%`,
            icon: Brain,
            color: "text-teal-500",
            bg: "bg-teal-50",
        },
        {
            label: "Approval Rate",
            value: `${data.approvalRate}%`,
            icon: CheckCircle2,
            color: "text-green-500",
            bg: "bg-green-50",
        },
        {
            label: "Escalation Rate",
            value: `${data.escalationRate}%`,
            icon: AlertTriangle,
            color: "text-amber-500",
            bg: "bg-amber-50",
        },
        {
            label: "Confidence Trend",
            value: data.confidenceTrend.length > 1 ? "+6%" : "0%",
            icon: TrendingUp,
            color: "text-primary",
            bg: "bg-primary/10",
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <div className="h-14 border-b bg-card flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push("/dashboard/ops-canvas")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                            <Zap className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">Analytics</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 rounded-lg text-xs"
                        onClick={() => router.push("/dashboard/ops-canvas/review")}
                    >
                        <Inbox className="h-3.5 w-3.5" /> Review Queue
                    </Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Your workflow performance at a glance.
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="rounded-2xl border shadow-sm">
                                <CardContent className="p-4">
                                    <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">AI Confidence Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={data.confidenceTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="confidence"
                                        stroke="hsl(239, 84%, 67%)"
                                        fill="hsl(239, 84%, 67%)"
                                        fillOpacity={0.1}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Response Time (min)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={data.responseTimeHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                                    <Tooltip />
                                    <Bar dataKey="time" fill="hsl(173, 58%, 39%)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Tickets by Day</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={data.confidenceTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                                    <Tooltip />
                                    <Bar dataKey="tickets" fill="hsl(263, 70%, 58%)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Category Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={data.categoryBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {data.categoryBreakdown.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-3 mt-2 justify-center">
                                {data.categoryBreakdown.map((category, index) => (
                                    <div key={category.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ background: COLORS[index % COLORS.length] }}
                                        />
                                        {category.name}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
