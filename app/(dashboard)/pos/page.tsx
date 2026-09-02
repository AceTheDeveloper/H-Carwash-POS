"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useServices from "@/hooks/useServices";
import useAddOns from "@/hooks/useAddOns"; //[cite: 2] Make sure this hook exists
import { ServicesData } from "@/types/ServicesData";
import { AddOnsData } from "@/types/AddOnsData";
import ServicesCard from "@/components/pos/ServicesCard";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  User,
  Phone,
  Hash,
  CarFront,
  Settings2,
  Sparkles,
  Receipt,
  CreditCard,
  AlertCircle,
  Tag,
  Loader2,
  Plus,
} from "lucide-react";

type VehicleSpecification = "4-wheels" | "2-wheels";
type VehicleSize = "small" | "medium" | "large" | "regular" | "big-bike";

type FormErrors = {
  customerName?: string;
  contactNumber?: string;
  plateNumber?: string;
};

export default function Page() {
  const { data: services, isLoading: isServicesLoading } = useServices();
  // FIXED: Use the correct hook for add-ons
  const { data: addOnsData, isLoading: isAddOnsLoading } = useAddOns();

  const [vehicleSpecification, setVehicleSpecification] =
    useState<VehicleSpecification>("4-wheels");
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>("medium");

  const [selectedService, setSelectedService] = useState<ServicesData | null>(
    null,
  );
  // State for multiple selected add-ons
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnsData[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract add-ons array safely depending on API structure (e.g., addOnsData.data or addOnsData)
  const addOnsList: AddOnsData[] =
    addOnsData?.json?.data ||
    addOnsData?.data ||
    (Array.isArray(addOnsData) ? addOnsData : []);

  // Reset the size and clear selections when the vehicle specification changes
  useEffect(() => {
    if (vehicleSpecification === "4-wheels") setVehicleSize("medium");
    if (vehicleSpecification === "2-wheels") setVehicleSize("regular");
    setSelectedService(null);
  }, [vehicleSpecification]);

  const toggleService = (service: ServicesData) => {
    setSelectedService((prev) => {
      if (prev?.id === service.id) return null;
      return service;
    });
  };

  // Toggle function for multi-select add-ons
  const toggleAddOn = (addon: AddOnsData) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((item) => item.id === addon.id);
      if (exists) {
        return prev.filter((item) => item.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const resetForm = () => {
    setCustomerName("");
    setPlateNumber("");
    setContactNumber("");
    setSelectedService(null);
    setSelectedAddOns([]);
    setErrors({});
    setVehicleSpecification("4-wheels");
    setVehicleSize("medium");
  };

  const onSubmit = async () => {
    const newErrors: FormErrors = {};
    if (!customerName.trim()) newErrors.customerName = "Name is required";
    if (!contactNumber.trim()) newErrors.contactNumber = "Phone is required";
    if (!plateNumber.trim()) newErrors.plateNumber = "Plate number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedService) return;

    const payload = {
      customer_name: customerName,
      contact_number: contactNumber,
      plate_number: plateNumber,
      vehicle_classification: vehicleSpecification,
      vehicle_size: vehicleSize,
      service: selectedService.id,
      service_price: Number(selectedService.service_price) || 0,
      add_ons: selectedAddOns.map((addon) => addon.id),
      add_ons_price: selectedAddOns.map((addon) =>
        addon.price ? Number(addon.price) : 0,
      ),
      total_price:
        Number(selectedService.service_price) +
        selectedAddOns.reduce(
          (sum, item) => sum + (Number(item.price) || 0),
          0,
        ),
    };

    setIsSubmitting(true);

    try {
      await api.post("/api/pos/checkout", payload);
      resetForm();
    } catch (error) {
      console.error("Error submitting checkout:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isServicesLoading || isAddOnsLoading) return null;

  const servicesToRender: ServicesData[] =
    services?.filter(
      (service: ServicesData) => service.vehicle_type === vehicleSpecification,
    ) || [];

  // Calculate total price: Service Price + Sum of Selected Add-Ons Prices
  const servicePrice = selectedService
    ? Number(selectedService.service_price) || 0
    : 0;
  const addOnsTotalPrice = selectedAddOns.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0,
  );
  const totalPrice = servicePrice + addOnsTotalPrice;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6 lg:h-screen lg:overflow-hidden font-sans">
      <main className="h-full max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Left Column - Main Content */}
          <section className="flex-1 flex flex-col gap-8 h-full lg:overflow-y-auto pr-1 pb-10 lg:pb-0 scrollbar-hide">
            {/* Header */}
            <div className="pb-2 border-b border-border/50">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                New Transaction
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Fill in customer details and select a service to proceed.
              </p>
            </div>

            {/* Customer Information Panel */}
            <div className="space-y-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Customer Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div className="space-y-2 relative">
                  <Label
                    htmlFor="customer-name"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="customer-name"
                      placeholder="Juan Dela Cruz"
                      value={customerName}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        clearError("customerName");
                      }}
                      className={`pl-9 h-11 bg-background focus-visible:ring-primary/30 ${
                        errors.customerName
                          ? "border-red-500 focus-visible:ring-red-500/30"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.customerName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.customerName}
                    </p>
                  )}
                </div>
                <div className="space-y-2 relative">
                  <Label
                    htmlFor="customer-phone"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="customer-phone"
                      type="tel"
                      placeholder="0912 345 6789"
                      value={contactNumber}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setContactNumber(e.target.value);
                        clearError("contactNumber");
                      }}
                      className={`pl-9 h-11 bg-background focus-visible:ring-primary/30 ${
                        errors.contactNumber
                          ? "border-red-500 focus-visible:ring-red-500/30"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contactNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2 relative">
                  <Label
                    htmlFor="customer-plate"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Plate Number
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="customer-plate"
                      placeholder="ABC 1234"
                      value={plateNumber}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setPlateNumber(e.target.value);
                        clearError("plateNumber");
                      }}
                      className={`pl-9 h-11 bg-background focus-visible:ring-primary/30 uppercase ${
                        errors.plateNumber
                          ? "border-red-500 focus-visible:ring-red-500/30"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.plateNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.plateNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Details Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <CarFront className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Specification
                  </h2>
                </div>
                <Tabs
                  value={vehicleSpecification}
                  onValueChange={(val) =>
                    setVehicleSpecification(val as VehicleSpecification)
                  }
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger
                      value="4-wheels"
                      disabled={isSubmitting}
                      className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      4 Wheels
                    </TabsTrigger>
                    <TabsTrigger
                      value="2-wheels"
                      disabled={isSubmitting}
                      className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      2 Wheels
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Vehicle Size
                  </h2>
                </div>
                <Tabs
                  value={vehicleSize}
                  onValueChange={(val) => setVehicleSize(val as VehicleSize)}
                  className="w-full"
                >
                  {vehicleSpecification === "4-wheels" ? (
                    <TabsList className="w-full grid grid-cols-3 h-12 p-1 bg-muted/50 rounded-xl">
                      <TabsTrigger
                        value="small"
                        disabled={isSubmitting}
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Small
                      </TabsTrigger>
                      <TabsTrigger
                        value="medium"
                        disabled={isSubmitting}
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Medium
                      </TabsTrigger>
                      <TabsTrigger
                        value="large"
                        disabled={isSubmitting}
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Large
                      </TabsTrigger>
                    </TabsList>
                  ) : (
                    <TabsList className="w-full grid grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
                      <TabsTrigger
                        value="regular"
                        disabled={isSubmitting}
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Regular
                      </TabsTrigger>
                      <TabsTrigger
                        value="big-bike"
                        disabled={isSubmitting}
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Big Bike
                      </TabsTrigger>
                    </TabsList>
                  )}
                </Tabs>
              </div>
            </div>

            {/* Services Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Available Services
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {servicesToRender.length > 0 ? (
                  servicesToRender.map((service: ServicesData) => {
                    const isSelected = selectedService?.id === service.id;

                    return (
                      <div
                        key={service.id}
                        onClick={() => !isSubmitting && toggleService(service)}
                        className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/10 scale-[1.01]"
                            : "border-transparent bg-card hover:border-primary/40 hover:shadow-sm"
                        } ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 z-10 text-primary bg-background rounded-full shadow-sm animate-in zoom-in duration-200">
                            <CheckCircle2 className="w-6 h-6 fill-primary text-primary-foreground" />
                          </div>
                        )}
                        <div className="p-1">
                          <ServicesCard service={service} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                    <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-3" />
                    <p className="text-base font-medium text-foreground">
                      No services found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try selecting a different vehicle specification.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Add-Ons Section (Rendered properly now) */}
            <div className="space-y-4 pb-12">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Tag className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Available Add-Ons
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {addOnsList.length > 0 ? (
                  addOnsList.map((addon: AddOnsData) => {
                    const isSelected = selectedAddOns.some(
                      (item) => item.id === addon.id,
                    );

                    return (
                      <div
                        key={addon.id}
                        onClick={() => !isSubmitting && toggleAddOn(addon)}
                        className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/10"
                            : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
                        } ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
                      >
                        <div className="flex flex-col pr-2">
                          <span className="font-semibold text-foreground text-sm">
                            {addon.label}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1 font-medium">
                            ₱
                            {Number(addon.price).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-transparent"}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    No add-ons available.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right Column - Sticky Order Summary Panel */}
          <section className="w-full lg:w-[380px] xl:w-[420px] h-auto lg:h-full flex flex-col shrink-0 lg:sticky lg:top-0 order-first lg:order-last mb-6 lg:mb-0">
            <div className="flex-1 bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              <div className="bg-muted/30 p-5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">
                    Order Summary
                  </h2>
                </div>
              </div>

              {/* Selected Items Area */}
              <div className="flex-1 p-5 overflow-y-auto bg-background/50 space-y-4">
                {!selectedService && selectedAddOns.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-70 mt-10 lg:mt-0">
                    <Tag className="w-12 h-12 mb-4 text-muted-foreground/40 stroke-[1.5]" />
                    <p className="text-sm font-medium">No items selected</p>
                    <p className="text-xs mt-1 max-w-[200px]">
                      Click on a service or add-on to build your order.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Selected Service Item */}
                    {selectedService && (
                      <div className="p-4 bg-card border border-primary/20 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col pr-4">
                            <span className="font-bold text-foreground text-sm">
                              {selectedService.service_name}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1 capitalize inline-flex items-center gap-1">
                              <Settings2 className="w-3 h-3" />
                              {vehicleSpecification.replace("-", " ")} •{" "}
                              {vehicleSize}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-foreground whitespace-nowrap">
                            ₱
                            {Number(
                              selectedService.service_price,
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Selected Add-Ons List */}
                    {selectedAddOns.map((addon) => (
                      <div
                        key={addon.id}
                        className="p-3 bg-card border border-border/60 rounded-xl shadow-sm flex justify-between items-center"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Add-On
                          </span>
                          <span className="font-medium text-foreground text-sm">
                            {addon.label}
                          </span>
                        </div>
                        <span className="font-semibold text-sm text-foreground">
                          ₱
                          {Number(addon.price).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Footer */}
              <div className="p-5 bg-card border-t border-border/50 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-base text-muted-foreground font-medium">
                    Total Amount
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight text-primary">
                    ₱
                    {totalPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <button
                  onClick={onSubmit}
                  disabled={!selectedService || isSubmitting}
                  className="w-full py-4 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 hover:shadow-lg disabled:shadow-none active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Proceed to Checkout
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
