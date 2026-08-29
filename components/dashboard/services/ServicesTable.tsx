// THIS IS A SERVER COMPONENT DO NOT RUIN THIS
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Direct database connection
import { InclusionData } from "@/types/InclusionData";
import { ServicesData } from "@/types/ServicesData";

export default async function ServicesTable() {
  const { data: services, error } = await supabase.from("services").select("*");

  if (error) {
    console.error("Failed to fetch services:", error.message);
  }

  const serviceList: ServicesData[] = services || [];

  return (
    <div className="w-full">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[120px] font-semibold text-foreground text-center">
              ID
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center">
              Service Name
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center">
              Price
            </TableHead>
            <TableHead className="font-semibold text-foreground max-w-[300px] text-center">
              Inclusions
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground text-center">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {serviceList.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-6"
              >
                No services found.
              </TableCell>
            </TableRow>
          ) : (
            serviceList.map((service, index) => (
              <TableRow
                key={service.id}
                className="hover:bg-muted/50 transition-colors group"
              >
                <TableCell className="text-xs text-muted-foreground font-medium text-center">
                  {index}
                </TableCell>

                <TableCell className="font-medium text-foreground text-center">
                  {service.service_name}
                </TableCell>

                <TableCell className="text-muted-foreground text-center">
                  ₱ {service.service_price}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1.5 items-center justify-center">
                    {/* {service.inclusions.map(
                      (inclusion: InclusionData, idx: number) => (
                        
                      ),
                    )} */}

                    {service.inclusions.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wider font-medium bg-background border-border"
                      >
                        {/* Call this one as item.label sooner once we fetched all the data by joining them */}
                        {item}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="text-right text-center">
                  <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                      aria-label="Edit service"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      aria-label="Delete service"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
