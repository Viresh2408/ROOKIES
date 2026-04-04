import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Utensils } from "lucide-react";

export const metadata = {
    title: "AI Knowledge Base",
};

const hubCards = [
    {
        title: "Manage Menu",
        description: "Add or update menu items for the AI agent.",
        href: "/dashboard/ai-knowledge/menu",
        icon: Utensils,
    },
    {
        title: "Manage FAQs",
        description: "Curate answers the AI can use to help customers.",
        href: "/dashboard/ai-knowledge/faqs",
        icon: HelpCircle,
    },
];

export default function AiKnowledgeHubPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">AI Knowledge Base</h1>
                <p className="text-muted-foreground">
                    This section allows business owners to control what the AI knows &mdash; without
                    writing any code. Updating this automatically changes how the AI responds to
                    customers.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {hubCards.map((card) => (
                    <Link key={card.href} href={card.href} className="group">
                        <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground">
                                        <card.icon className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {card.title}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
