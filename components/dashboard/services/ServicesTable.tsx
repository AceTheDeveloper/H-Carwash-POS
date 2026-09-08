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
import { ServiceSizes } from "@/types/ServicesPayload";
import useServices from "@/hooks/useServices";
import ServicesEditDialog from "@/components/dashboard/services/ServicesEditDialog";
import { useState } from "react";
import DeleteDialog from "@/components/reusables/DeleteDialog";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  search: string;
  setSearch: () => void;
  sort?: string; // Added sort prop here
}

export default function ServicesTable({
  search,
  setSearch,
  sort = "name-asc",
}: Props) {
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

  // 1. Filter by search query
  const filteredServices: ServicesData[] = (serviceList || []).filter(
    (service: ServicesData) => {
      return service.service_name.toLowerCase().includes(search.toLowerCase());
    },
  );

  // 2. Helper to get the base price of a service for sorting purposes
  const getMinPrice = (service: ServicesData) => {
    const sizes = Array.isArray(service.size)
      ? service.size
      : typeof service.size === "string"
        ? (JSON.parse(service.size) as ServiceSizes[])
        : ([] as ServiceSizes[]);
    if (sizes.length === 0) return 0;
    // Return the lowest price among sizes or fallback to 0
    return Math.min(...sizes.map((size) => Number(size.price) || 0));
  };

  // 3. Sort filtered services based on selected dropdown value
  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sort === "name-asc") {
      return a.service_name.localeCompare(b.service_name);
    }
    if (sort === "name-desc") {
      return b.service_name.localeCompare(a.service_name);
    }
    if (sort === "price-asc") {
      return getMinPrice(a) - getMinPrice(b);
    }
    if (sort === "price-desc") {
      return getMinPrice(b) - getMinPrice(a);
    }
    return 0;
  });

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
              Sizes & Prices
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground text-center">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedServices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-6"
              >
                No services found.
              </TableCell>
            </TableRow>
          ) : (
            sortedServices.map((service: ServicesData, index: number) => {
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
                    {index + 1}
                  </TableCell>

                  <TableCell className="font-medium text-foreground text-center">
                    {service.service_name}
                  </TableCell>

                  <TableCell className="text-muted-foreground text-center">
                    <div className="flex items-center gap-2 justify-center flex-wrap capitalize">
                      {sizes.map((ser: ServiceSizes, i: number) => (
                        <span
                          key={i}
                          className="bg-muted px-2 py-0.5 rounded-md text-xs"
                        >
                          {ser.size}: ₱{ser.price}
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
