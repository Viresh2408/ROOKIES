"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    type Connection,
    type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Save,
    Play,
    Rocket,
    Eye,
    Inbox,
    Zap,
    ArrowLeft,
    ChevronRight,
} from "lucide-react";
import NodeLibrary from "./_components/node-library";
import WorkflowNode from "./_components/workflow-node";
import ConfigPanel from "./_components/config-panel";
import {
    MSME_TEMPLATE,
    SMALL_BUSINESS_TEMPLATE,
    type WorkflowNodeData,
    type NodeCategory,
} from "@/lib/ops-canvas/workflow-types";
import { toast } from "sonner";

const DEFAULT_TEMPLATE = "small";

export default function OpsCanvasPage() {
    const router = useRouter();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [dragData, setDragData] = useState<{
        category: NodeCategory;
        label: string;
        description: string;
    } | null>(null);
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simStep, setSimStep] = useState(-1);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const initial = template === "msme" ? MSME_TEMPLATE : SMALL_BUSINESS_TEMPLATE;
    const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>(initial.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

    const nodeTypes = useMemo(() => ({ workflow: WorkflowNode }), []);

    const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

    const loadWorkflow = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ops-canvas/workflow");
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "Failed to load workflow");
            }
            if (data?.workflow) {
                setWorkflowId(data.workflow.id);
                setTemplate(data.workflow.template || DEFAULT_TEMPLATE);
                setNodes(Array.isArray(data.workflow.nodes) ? data.workflow.nodes : []);
                setEdges(Array.isArray(data.workflow.edges) ? data.workflow.edges : []);
            } else {
                setNodes(initial.nodes);
                setEdges(initial.edges);
            }
        } catch {

            toast.error("Unable to load workflow");
        } finally {
            setLoading(false);
        }
    }, [initial.edges, initial.nodes, setEdges, setNodes]);

    useEffect(() => {
        loadWorkflow();
    }, [loadWorkflow]);

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((current) => addEdge({ ...params, animated: true }, current));
        },
        [setEdges]
    );

    const onNodeClick = useCallback((_: unknown, node: { id: string }) => {
        setSelectedNodeId(node.id);
    }, []);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            if (!dragData || !reactFlowInstance || !reactFlowWrapper.current) return;

            const bounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.project({
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            });

            const newNode = {
                id: `node-${Date.now()}`,
                type: "workflow",
                position,
                data: {
                    label: dragData.label,
                    description: dragData.description,
                    category: dragData.category,
                    status: "needs-setup" as const,
                    config: {},
                },
            };

            setNodes((current) => current.concat(newNode));
            setDragData(null);
        },
        [dragData, reactFlowInstance, setNodes]
    );

    const updateConfig = useCallback(
        (nodeId: string, key: string, value: unknown) => {
            setNodes((current) =>
                current.map((node) =>
                    node.id === nodeId
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                config: { ...node.data.config, [key]: value },
                            },
                        }
                        : node
                )
            );
        },
        [setNodes]
    );

    const runSimulation = useCallback(() => {
        if (simulating) return;
        setSimulating(true);
        setSimStep(0);
        const totalSteps = nodes.length;
        let step = 0;

        const interval = setInterval(() => {
            step += 1;
            if (step >= totalSteps) {
                clearInterval(interval);
                setTimeout(() => {
                    setSimulating(false);
                    setSimStep(-1);
                }, 1500);
            }
            setSimStep(step);
        }, 800);
    }, [nodes.length, simulating]);

    const displayNodes = useMemo(() => {
        if (!simulating) return nodes;
        return nodes.map((node, index) => ({
            ...node,
            data: {
                ...node.data,
                status: index === simStep
                    ? "active"
                    : index < simStep
                        ? "configured"
                        : node.data.status,
            },
        }));
    }, [nodes, simulating, simStep]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/ops-canvas/workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: workflowId,
                    name: "Main Workflow",
                    template,
                    nodes,
                    edges,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "Unable to save workflow");
            }
            setWorkflowId(data.workflow?.id ?? workflowId);
            toast.success("Workflow saved");
        } catch {

            toast.error("Unable to save workflow");
        } finally {
            setSaving(false);
        }
    }, [edges, nodes, template, workflowId]);

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Top Bar */}
            <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/dashboard")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                            <Zap className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">Ops Canvas</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 rounded-lg text-xs"
                        onClick={handleSave}
                        isLoading={saving}
                    >
                        <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8 rounded-lg text-xs"
                        onClick={runSimulation}
                        disabled={simulating || loading}
                    >
                        <Play className="h-3.5 w-3.5" /> {simulating ? "Running..." : "Test Run"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8 rounded-lg text-xs">
                        <Eye className="h-3.5 w-3.5" /> Preview
                    </Button>
                    <Button size="sm" className="gap-1.5 h-8 rounded-lg text-xs">
                        <Rocket className="h-3.5 w-3.5" /> Publish
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
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

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                <NodeLibrary
                    onDragStart={(category, label, description) =>
                        setDragData({ category, label, description })
                    }
                />

                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={displayNodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onInit={setReactFlowInstance}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={nodeTypes}
                        fitView
                        snapToGrid
                        snapGrid={[20, 20]}
                        className="bg-muted/30"
                    >
                        <Controls className="!rounded-xl !border !shadow-lg" />
                        <Background gap={20} size={1} />
                    </ReactFlow>

                    <AnimatePresence>
                        {simulating && simStep >= nodes.length && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card border rounded-2xl shadow-2xl p-6 max-w-sm"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <ChevronRight className="h-4 w-4 text-green-600" />
                                    </div>
                                    <h4 className="font-semibold text-foreground text-sm">Simulation Complete</h4>
                                </div>
                                <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
                                    <p className="font-medium text-foreground mb-1">AI Draft Reply:</p>
                                    <p>
                                        &quot;Hi! I have checked on your order and it is currently in transit. Expected
                                        delivery is tomorrow. Would you like the tracking link?&quot;
                                    </p>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {selectedNode && (
                        <ConfigPanel
                            nodeId={selectedNode.id}
                            nodeData={selectedNode.data}
                            onClose={() => setSelectedNodeId(null)}
                            onUpdateConfig={updateConfig}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
