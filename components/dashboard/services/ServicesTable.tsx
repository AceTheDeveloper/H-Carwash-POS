// THIS IS A SERVER COMPONENT DO NOT RUIN THIS
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // Assuming you have Shadcn Badge installed
import { Edit, Trash2 } from "lucide-react";

export default function ServicesTable() {
  // Mock data to demonstrate the improved layout and spacing
  const services = [
    {
      id: "SRV-1042",
      name: "Premium Wash",
      price: "₱ 350.00",
      inclusions: ["Exterior Wash", "Tire Shine", "Window Cleaning"],
    },
    {
      id: "SRV-1043",
      name: "Full Interior Detailing",
      price: "₱ 1,200.00",
      inclusions: ["Deep Vacuum", "Shampoo", "Leather Conditioning"],
    },
    {
      id: "SRV-1044",
      name: "Ceramic Coating",
      price: "₱ 4,500.00",
      inclusions: ["Paint Correction", "1-Year Coating", "Maintenance Wash"],
    },
  ];

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
          {services.map((service) => (
            <TableRow
              key={service.id}
              className="hover:bg-muted/50 transition-colors group"
            >
              {/* ID formatted subtly to draw attention to the Name instead */}
              <TableCell className=" text-xs text-muted-foreground font-medium text-center">
                {service.id}
              </TableCell>

              <TableCell className="font-medium text-foreground text-center">
                {service.name}
              </TableCell>

              <TableCell className="text-muted-foreground text-center">
                {service.price}
              </TableCell>

              {/* Badges help separate list items cleanly without looking like a run-on sentence */}
              <TableCell>
                <div className="flex flex-wrap gap-1.5 items-center justify-center">
                  {service.inclusions.map((inclusion, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[10px] uppercase tracking-wider font-medium bg-background border-border"
                    >
                      {inclusion}
                    </Badge>
                  ))}
                </div>
              </TableCell>

              <TableCell className="text-right text-center">
                <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Styled as ghost buttons using utility classes */}
                  <button
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    aria-label="Edit service"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-md transition-colors"
                    aria-label="Delete service"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
