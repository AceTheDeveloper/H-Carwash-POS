"use client";

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
import { InclusionData } from "@/types/InclusionData";
import { ServicesData } from "@/types/ServicesData";
import useServices from "@/hooks/useServices";
import ServicesEditDialog from "@/components/dashboard/services/ServicesEditDialog";
import { useState } from "react";

interface Props {
  search: string;
  setSearch: () => void;
}

export default function ServicesTable({ search, setSearch }: Props) {
  const { data: serviceList, isLoading } = useServices();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ServicesData | null>(
    null,
  );

  function handleEdit(selectedService: ServicesData) {
    setSelectedService(selectedService);
    setIsOpen(true);
  }

  if (isLoading) return null;

  const filteredServices: ServicesData[] = serviceList.filter(
    (service: ServicesData) => {
      return service.service_name.toLowerCase().includes(search.toLowerCase());
    },
  );

  return (
    <div className="w-full">
      <Table className="rounded-md">
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[120px] font-semibold text-foreground text-center">
              ID
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center">
              Service Name
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center">
              Sizes
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground text-center">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredServices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-6"
              >
                No services found.
              </TableCell>
            </TableRow>
          ) : (
            filteredServices.map((service: ServicesData, index: number) => (
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
                  <div className="flex items-center gap-2 justify-center">
                    {service.size.map((ser, index) => (
                      <span key={index}>{ser.size}</span>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="text-right text-center">
                  <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                      aria-label="Edit service"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      aria-label="Delete service"
                      onClick={() => {}}
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

      {selectedService && (
        <ServicesEditDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          selectedService={selectedService}
        />
      )}
    </div>
  );
}
