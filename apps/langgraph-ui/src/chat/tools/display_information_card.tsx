import { createUITool } from "@langgraph-js/sdk";
import { z } from "zod";
import { Info, CheckCircle, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DisplayInformationCardSchema = {
    image_url: z.url().optional().describe("Optional image URL (for info card type)"),
    title: z.string().describe("Card title"),
    content: z.string().describe("Main content text"),
    type: z.enum(["info", "success", "warning", "error"]).optional().default("info").describe("Card style (for info card type)"),
    actions: z
        .array(
            z.object({
                label: z.string().describe("Button label"),
                action_id: z.string().describe("Action identifier"),
                link: z.url().optional(),
            })
        )
        .optional()
        .describe("Action buttons"),
};

const getTypeStyles = (type: "info" | "success" | "warning" | "error") => {
    switch (type) {
        case "success":
            return {
                icon: CheckCircle,
                iconColor: "text-green-600",
                iconBg: "bg-green-50",
                badgeText: "Success",
                badgeVariant: "outline" as const,
            };
        case "warning":
            return {
                icon: AlertTriangle,
                iconColor: "text-yellow-600",
                iconBg: "bg-yellow-50",
                badgeText: "Warning",
                badgeVariant: "outline" as const,
            };
        case "error":
            return {
                icon: XCircle,
                iconColor: "text-red-600",
                iconBg: "bg-red-50",
                badgeText: "Error",
                badgeVariant: "outline" as const,
            };
        case "info":
        default:
            return {
                icon: Info,
                iconColor: "text-blue-600",
                iconBg: "bg-blue-50",
                badgeText: "Info",
                badgeVariant: "outline" as const,
            };
    }
};

export const display_information_card = createUITool({
    name: "display_information_card",
    description: "Display an information card to the user.",
    parameters: DisplayInformationCardSchema,
    onlyRender: true,
    render(tool) {
        const data = tool.getInputRepaired();
        const typeStyles = getTypeStyles(data.type || "info");
        const IconComponent = typeStyles.icon;
        const hasActions = data.actions && data.actions.length > 0;

        const handleActionClick = (action: { label: string; action_id: string; link?: string }) => {
            if (action.link) {
                window.open(action.link, "_blank", "noopener,noreferrer");
            }
        };

        return (
            <div className="w-[50%] my-1 border border-gray-200 bg-white shadow-none rounded-xl overflow-hidden">
                <div className="pb-2 p-3 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", typeStyles.iconBg)}>
                                <IconComponent className={cn("w-3.5 h-3.5", typeStyles.iconColor)} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">{data.title}</h3>
                        </div>
                        <Badge variant={typeStyles.badgeVariant} className="bg-white text-gray-600 border-gray-200 font-normal">
                            {typeStyles.badgeText}
                        </Badge>
                    </div>
                </div>
                <div className="p-3 space-y-3">
                    <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{data.content}</div>

                    {data.image_url && (
                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <img src={data.image_url} alt={data.title} className="w-full h-auto object-cover max-h-[400px]" />
                        </div>
                    )}

                    {hasActions && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {data.actions!.map((action, index) => (
                                <Button
                                    key={index}
                                    onClick={() => handleActionClick(action)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                                        data.type === "success"
                                            ? "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
                                            : data.type === "warning"
                                              ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm hover:shadow-md"
                                              : data.type === "error"
                                                ? "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md"
                                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                                    )}
                                >
                                    {action.label}
                                    {action.link && <ExternalLink className="w-3 h-3 ml-1.5" />}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    },
});
