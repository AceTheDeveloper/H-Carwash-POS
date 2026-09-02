"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { ServicesData } from "@/types/ServicesData";
import useServices from "@/hooks/useServices";
import ServicesEditDialog from "@/components/dashboard/services/ServicesEditDialog";
import { useState } from "react";
import DeleteDialog from "@/components/reusables/DeleteDialog";
import { api } from "@/lib/api"; // Make sure to import your API client
import { useQueryClient } from "@tanstack/react-query"; // Import to refresh table

interface Props {
  search: string;
  setSearch: () => void;
}

export default function ServicesTable({ search, setSearch }: Props) {
  const { data: serviceList, isLoading } = useServices();
  const queryClient = useQueryClient();

  // State for Edit Dialog
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ServicesData | null>(
    null,
  );

  // State for Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServicesData | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  function handleEdit(service: ServicesData) {
    setSelectedService(service);
    setIsOpen(true);
  }

  function handleDeletePrompt(service: ServicesData) {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  }

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/services/${serviceToDelete.id}`);

      // Close dialog and refresh data
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch (error) {
      console.error("Failed to delete service:", error);
    } finally {
      setIsDeleting(false);
    }
  };

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
            filteredServices.map((service: ServicesData, index: number) => {
              // Parse the size array safely for display
              const sizes = Array.isArray(service.size)
                ? service.size
                : typeof service.size === "string"
                  ? JSON.parse(service.size)
                  : [];

              return (
                <TableRow
                  key={service.id}
                  className="hover:bg-muted/50 transition-colors group"
                >
                  <TableCell className="text-xs text-muted-foreground font-medium text-center">
                    {index + 1}{" "}
                    {/* Changed to index + 1 so it doesn't start at 0 */}
                  </TableCell>

                  <TableCell className="font-medium text-foreground text-center">
                    {service.service_name}
                  </TableCell>

                  <TableCell className="text-muted-foreground text-center">
                    <div className="flex items-center gap-2 justify-center capitalize">
                      {sizes.map((ser: any, i: number) => (
                        <span
                          key={i}
                          className="bg-muted px-2 py-0.5 rounded-md text-xs"
                        >
                          {ser.size}
                        </span>
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
                        // Trigger the prompt and pass the specific service
                        onClick={() => handleDeletePrompt(service)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      {selectedService && (
        <ServicesEditDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          selectedService={selectedService}
        />
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        title="Delete Service"
        message={`Are you sure you want to delete "${serviceToDelete?.service_name}"? This action cannot be undone.`}
        onOkayPress={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
