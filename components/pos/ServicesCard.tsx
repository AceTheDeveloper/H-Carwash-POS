import { Card } from "@/components/ui/card";
import { ServicesData } from "@/types/ServicesData";
import { InclusionData } from "@/types/InclusionData";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";

interface Props {
  service: ServicesData;
}

function ServicesCard({ service }: Props) {
  // Format the price with commas and 2 decimal places
  const formattedPrice = Number(service.service_price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Safely parse the stringified JSON items in the inclusions array
  const parsedInclusions = useMemo<InclusionData[]>(() => {
    if (!service.inclusions || !Array.isArray(service.inclusions)) return [];

    return service.inclusions
      .map((item) => {
        if (typeof item === "string") {
          try {
            return JSON.parse(item) as InclusionData;
          } catch (error) {
            console.error("Failed to parse inclusion:", item);
            return null;
          }
        }
        return item as InclusionData;
      })
      .filter(Boolean) as InclusionData[];
  }, [service.inclusions]);

  // Join the labels into a single comma-separated string
  const inclusionText = parsedInclusions.map((inc) => inc.label).join(", ");

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent p-3">
      {/* Top Section: Title, Icon, and Price */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2">
            {service.service_name}
          </h3>
          <div className="mt-1 text-lg font-black text-primary tracking-tight">
            ₱{formattedPrice}
          </div>
        </div>
        <div className="bg-primary/10 p-1.5 rounded-md shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>

      {/* Bottom Section: Compact Inclusions */}
      <div className="mt-auto pt-2 mt-2 border-t border-border/60">
        {parsedInclusions.length > 0 ? (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
            <span className="font-semibold text-foreground/70 mr-1">
              Includes:
            </span>
            {inclusionText}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">
            No inclusions
          </p>
        )}
      </div>
    </Card>
  );
}

export default ServicesCard;
