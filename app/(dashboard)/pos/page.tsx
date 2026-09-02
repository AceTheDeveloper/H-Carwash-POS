"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useServices from "@/hooks/useServices";
import useAddOns from "@/hooks/useAddOns";
// Mock or import your staff hook if available, e.g.: import useStaff from "@/hooks/useStaff";
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
  Users,
  Banknote,
  QrCode,
  ChevronDown,
} from "lucide-react";

type VehicleSpecification = "4-wheels" | "2-wheels";
type PaymentMethod = "cash" | "qr";

type FormErrors = {
  customerName?: string;
  contactNumber?: string;
  plateNumber?: string;
  paymentMethod?: string;
  staff?: string;
};

// Mock Staff interface (Replace with your actual staff type/hook)
interface StaffMember {
  id: string;
  name: string;
}

export default function Page() {
  const { data: services, isLoading: isServicesLoading } = useServices();
  const { data: addOnsData, isLoading: isAddOnsLoading } = useAddOns();

  // Mock staff data list (Replace this with `useStaff()` hook if you have one)
  const staffList: StaffMember[] = [
    { id: "staff_1", name: "Alex Reyes" },
    { id: "staff_2", name: "Marco Santos" },
    { id: "staff_3", name: "Junjun Cruz" },
    { id: "staff_4", name: "Nico Bautista" },
  ];

  const [vehicleSpecification, setVehicleSpecification] =
    useState<VehicleSpecification>("4-wheels");

  const [selectedService, setSelectedService] = useState<ServicesData | null>(
    null,
  );

  const [selectedSizeObj, setSelectedSizeObj] = useState<{
    size: string;
    price: number;
  } | null>(null);

  const [selectedAddOns, setSelectedAddOns] = useState<AddOnsData[]>([]);

  // NEW STATES: Payment Method & Multi-select Staff in Charge
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOnsList: AddOnsData[] =
    addOnsData?.json?.data ||
    addOnsData?.data ||
    (Array.isArray(addOnsData) ? addOnsData : []);

  useEffect(() => {
    setSelectedService(null);
    setSelectedSizeObj(null);
  }, [vehicleSpecification]);

  const toggleService = (service: ServicesData) => {
    setSelectedService((prev) => {
      if (prev?.id === service.id) {
        setSelectedSizeObj(null);
        return null;
      }
      const sizes =
        (service.size as Array<{ size: string; price: number }>) || [];
      if (sizes.length > 0) {
        setSelectedSizeObj(sizes[0]);
      } else {
        setSelectedSizeObj(null);
      }
      return service;
    });
  };

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

  // Toggle multiple staff handler
  const toggleStaffMember = (staffId: string) => {
    setSelectedStaff((prev) => {
      const exists = prev.includes(staffId);
      if (exists) {
        return prev.filter((id) => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
    clearError("staff");
  };

  const resetForm = () => {
    setCustomerName("");
    setPlateNumber("");
    setContactNumber("");
    setSelectedService(null);
    setSelectedSizeObj(null);
    setSelectedAddOns([]);
    setPaymentMethod(null);
    setSelectedStaff([]);
    setErrors({});
    setVehicleSpecification("4-wheels");
  };

  const servicePrice = selectedSizeObj ? Number(selectedSizeObj.price) || 0 : 0;
  const addOnsTotalPrice = selectedAddOns.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0,
  );
  const totalPrice = servicePrice + addOnsTotalPrice;

  const onSubmit = async () => {
    const newErrors: FormErrors = {};
    if (!customerName.trim()) newErrors.customerName = "Name is required";
    if (!contactNumber.trim()) newErrors.contactNumber = "Phone is required";
    if (!plateNumber.trim()) newErrors.plateNumber = "Plate number is required";
    if (!paymentMethod) newErrors.paymentMethod = "Select payment method";
    if (selectedStaff.length === 0)
      newErrors.staff = "Assign at least one staff member";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedService || !selectedSizeObj) return;

    const payload = {
      customer_name: customerName,
      contact_number: contactNumber,
      plate_number: plateNumber,
      vehicle_classification: vehicleSpecification,
      vehicle_size: selectedSizeObj.size,
      service: selectedService.id,
      service_price: servicePrice,
      add_ons: selectedAddOns.map((addon) => addon.id),
      add_ons_price: selectedAddOns.map((addon) =>
        addon.price ? Number(addon.price) : 0,
      ),
      payment_method: paymentMethod, // 'cash' or 'qr'
      staff_in_charge: selectedStaff, // Array of staff IDs (One or More)
      total_price: totalPrice,
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
                1. Select vehicle type, 2. Choose service, 3. Select service
                size.
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
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      placeholder="Juan Dela Cruz"
                      value={customerName}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        clearError("customerName");
                      }}
                      className={`pl-9 h-11 bg-background ${
                        errors.customerName ? "border-red-500" : ""
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
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      type="tel"
                      placeholder="0912 345 6789"
                      value={contactNumber}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setContactNumber(e.target.value);
                        clearError("contactNumber");
                      }}
                      className={`pl-9 h-11 bg-background ${
                        errors.contactNumber ? "border-red-500" : ""
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
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Plate Number
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      placeholder="ABC 1234"
                      value={plateNumber}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setPlateNumber(e.target.value);
                        clearError("plateNumber");
                      }}
                      className={`pl-9 h-11 bg-background uppercase ${
                        errors.plateNumber ? "border-red-500" : ""
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

            {/* Step 1: Vehicle Specification Panel */}
            <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <CarFront className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Step 1: Select Vehicle Type
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
                    className="rounded-lg"
                  >
                    4 Wheels
                  </TabsTrigger>
                  <TabsTrigger
                    value="2-wheels"
                    disabled={isSubmitting}
                    className="rounded-lg"
                  >
                    2 Wheels
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Step 2: Services Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Step 2: Choose Service
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
                          <div className="absolute top-3 right-3 z-10 text-primary bg-background rounded-full shadow-sm">
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
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Vehicle Size Panel */}
            {selectedService && (
              <div className="bg-card p-5 rounded-2xl border border-primary/40 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Step 3: Select Service Size for &quot;
                    {selectedService.service_name}&quot;
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(
                    (selectedService.size as Array<{
                      size: string;
                      price: number;
                    }>) || []
                  ).map((sizeObj) => {
                    const isSizeSelected =
                      selectedSizeObj?.size === sizeObj.size;
                    return (
                      <button
                        key={sizeObj.size}
                        type="button"
                        onClick={() => setSelectedSizeObj(sizeObj)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                          isSizeSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "border-border/60 bg-background hover:border-primary/40 text-foreground"
                        }`}
                      >
                        <span className="capitalize text-sm">
                          {sizeObj.size}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          ₱
                          {Number(sizeObj.price).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add-Ons Section */}
            <div className="space-y-4 pb-12">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Tag className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Available Add-Ons (Optional)
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
                        }`}
                      >
                        <div className="flex flex-col pr-2">
                          <span className="font-semibold text-foreground text-sm">
                            {addon.label}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1 font-medium">
                            ₱
                            {Number(addon.price).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
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
                      Follow steps on the left to build order.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                              {selectedSizeObj?.size || "Select size"}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-foreground">
                            ₱
                            {servicePrice.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedAddOns.map((addon) => (
                      <div
                        key={addon.id}
                        className="p-3 bg-card border border-border/60 rounded-xl shadow-sm flex justify-between items-center"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-muted-foreground uppercase">
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
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Controls Section (Payment Method & Commission Staff) */}
              <div className="p-5 bg-card border-t border-border/50 space-y-4">
                {/* 1. Payment Method Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("cash");
                        clearError("paymentMethod");
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                        paymentMethod === "cash"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("qr");
                        clearError("paymentMethod");
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                        paymentMethod === "qr"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </button>
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-xs text-red-500">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>

                {/* 2. Staff in Charge Multi-Select Dropdown */}
                <div className="space-y-2 relative">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Staff In Charge (Commission)
                  </label>

                  <div
                    onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                    className={`w-full min-h-[44px] px-3 py-2 bg-background border rounded-xl flex items-center justify-between cursor-pointer text-xs ${
                      errors.staff ? "border-red-500" : "border-border/60"
                    }`}
                  >
                    <div className="flex flex-wrap gap-1 items-center">
                      {selectedStaff.length === 0 ? (
                        <span className="text-muted-foreground">
                          Select staff member(s)...
                        </span>
                      ) : (
                        selectedStaff.map((id) => {
                          const staffObj = staffList.find((s) => s.id === id);
                          return (
                            <span
                              key={id}
                              className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium text-xs"
                            >
                              {staffObj?.name}
                            </span>
                          );
                        })
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>

                  {/* Dropdown Box Options */}
                  {isStaffDropdownOpen && (
                    <div className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg p-2 z-20 space-y-1 max-h-48 overflow-y-auto">
                      {staffList.map((staff) => {
                        const isChecked = selectedStaff.includes(staff.id);
                        return (
                          <div
                            key={staff.id}
                            onClick={() => toggleStaffMember(staff.id)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-medium"
                          >
                            <span>{staff.name}</span>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"}`}
                            >
                              {isChecked && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {errors.staff && (
                    <p className="text-xs text-red-500">{errors.staff}</p>
                  )}
                </div>

                {/* Total Summary */}
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
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
                  disabled={
                    !selectedService || !selectedSizeObj || isSubmitting
                  }
                  className="w-full py-4 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Complete Transaction
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
