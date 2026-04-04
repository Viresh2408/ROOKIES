"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NODE_CATEGORIES, NODE_LIBRARY, type NodeCategory } from "@/lib/ops-canvas/workflow-types";

interface NodeLibraryProps {
    onDragStart: (category: NodeCategory, label: string, description: string) => void;
}

export default function NodeLibrary({ onDragStart }: NodeLibraryProps) {
    const [search, setSearch] = useState("");

    const filtered = NODE_LIBRARY.map((group) => ({
        ...group,
        items: group.items.filter(
            (item) =>
                item.label.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase())
        ),
    })).filter((group) => group.items.length > 0);

    return (
        <div className="w-64 bg-card border-r flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-foreground text-sm mb-3">Node Library</h3>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search nodes..."
                        className="pl-8 h-9 rounded-lg text-sm"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {filtered.map((group) => {
                    const meta = NODE_CATEGORIES[group.category];
                    return (
                        <div key={group.category}>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <div className={`h-5 w-5 rounded flex items-center justify-center ${meta.bgClass}`}>
                                    <meta.icon className="h-3 w-3" style={{ color: meta.color }} />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {meta.label}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <div
                                        key={item.label}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.effectAllowed = "move";
                                            onDragStart(group.category, item.label, item.description);
                                        }}
                                        className="p-2.5 rounded-xl border bg-background cursor-grab hover:shadow-md hover:border-foreground/20 transition-all active:cursor-grabbing"
                                    >
                                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
