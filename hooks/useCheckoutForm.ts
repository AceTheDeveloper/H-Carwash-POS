"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ServicesData } from "@/types/ServicesData";
import { AddOnsData } from "@/types/AddOnsData";
import {
  VehicleSpecification,
  PaymentMethod,
  FormErrors,
  SizeOption,
  CheckoutPayload,
} from "@/types/Checkout";

export function useCheckoutForm() {
  const [vehicleSpecification, setVehicleSpecification] =
    useState<VehicleSpecification>("4-wheels");
  const [selectedService, setSelectedService] = useState<ServicesData | null>(
    null,
  );
  const [selectedSizeObj, setSelectedSizeObj] = useState<SizeOption | null>(
    null,
  );
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnsData[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset service selection when vehicle type changes
  useEffect(() => {
    setSelectedService(null);
    setSelectedSizeObj(null);
  }, [vehicleSpecification]);

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const toggleService = (service: ServicesData) => {
    setSelectedService((prev) => {
      if (prev?.id === service.id) {
        setSelectedSizeObj(null);
        return null;
      }
      const sizes = (service.size as SizeOption[]) || [];
      setSelectedSizeObj(sizes.length > 0 ? sizes[0] : null);
      return service;
    });
  };

  const toggleAddOn = (addon: AddOnsData) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((item) => item.id === addon.id);
      return exists
        ? prev.filter((item) => item.id !== addon.id)
        : [...prev, addon];
    });
  };

  const toggleStaffMember = (staffId: string) => {
    setSelectedStaff((prev) => {
      const exists = prev.includes(staffId);
      return exists ? prev.filter((id) => id !== staffId) : [...prev, staffId];
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

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!customerName.trim()) newErrors.customerName = "Name is required";
    if (!contactNumber.trim()) newErrors.contactNumber = "Phone is required";
    if (!plateNumber.trim()) newErrors.plateNumber = "Plate number is required";
    if (!paymentMethod) newErrors.paymentMethod = "Select payment method";
    if (selectedStaff.length === 0)
      newErrors.staff = "Assign at least one staff member";
    return newErrors;
  };

  const onSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (!selectedService || !selectedSizeObj || !paymentMethod) return;

    const payload: CheckoutPayload = {
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
      payment_method: paymentMethod,
      staff_in_charge: selectedStaff,
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

  return {
    // state
    vehicleSpecification,
    selectedService,
    selectedSizeObj,
    selectedAddOns,
    paymentMethod,
    selectedStaff,
    customerName,
    plateNumber,
    contactNumber,
    errors,
    isSubmitting,
    servicePrice,
    addOnsTotalPrice,
    totalPrice,
    // setters
    setVehicleSpecification,
    setSelectedSizeObj,
    setPaymentMethod,
    setCustomerName,
    setPlateNumber,
    setContactNumber,
    // handlers
    toggleService,
    toggleAddOn,
    toggleStaffMember,
    clearError,
    onSubmit,
  };
}

export type CheckoutFormState = ReturnType<typeof useCheckoutForm>;
