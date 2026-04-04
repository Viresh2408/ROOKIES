import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { NODE_CATEGORIES, type WorkflowNodeData } from "@/lib/ops-canvas/workflow-types";

const WorkflowNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
    const meta = NODE_CATEGORIES[data.category];
    const Icon = meta.icon;

    return (
        <div
            className={`relative group min-w-[200px] rounded-2xl border-2 bg-card shadow-md transition-all duration-200 ${
                selected
                    ? "shadow-xl scale-105 ring-2 ring-primary/30"
                    : "hover:shadow-lg"
            }`}
            style={{ borderColor: meta.color }}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-3 !w-3 !border-2 !border-card"
                style={{ background: meta.color }}
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!h-3 !w-3 !border-2 !border-card"
                style={{ background: meta.color }}
            />

            <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${meta.bgClass}`}>
                        <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">{data.label}</h4>
                        <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                data.status === "configured"
                                    ? "bg-green-50 text-green-700"
                                    : data.status === "active"
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-amber-50 text-amber-700"
                            }`}
                        >
                            {data.status === "configured"
                                ? "Ready"
                                : data.status === "active"
                                    ? "Active"
                                    : "Setup needed"}
                        </span>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.description}
                </p>
            </div>
        </div>
    );
});

WorkflowNode.displayName = "WorkflowNode";

export default WorkflowNode;
