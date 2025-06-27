"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Command, 
  Download, 
  BarChart3, 
  Settings,
  Zap} from "lucide-react";
import Link from "next/link";

export function MobileQuickActions() {
  const isMobile = useIsMobile();

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  const quickActions = [
    {
      title: "Generate",
      icon: Zap,
      href: "/dashboard/hashtag-generator",
      description: "Create hashtags",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      description: "View insights",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Extension",
      icon: Download,
      href: "/dashboard/settings/account",
      description: "Download",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings/account",
      description: "Account",
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ];

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Command className="size-4 text-primary" />
          <h3 className="font-medium text-sm">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              asChild
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <Link href={action.href}>
                <div className={`p-2 rounded-lg text-white ${action.color}`}>
                  <action.icon className="size-4" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-xs">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 