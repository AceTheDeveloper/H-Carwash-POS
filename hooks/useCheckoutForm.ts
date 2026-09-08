import { api } from "@/lib/api";
import { AddOnsData } from "@/types/AddOnsData";
import {
  FormErrors,
  PaymentMethod,
  SizeOption,
  VehicleSpecification,
} from "@/types/Checkout";
import { PromoData } from "@/types/PromoData";
import { ServicesData } from "@/types/ServicesData";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export interface SelectedAddOnItem extends AddOnsData {
  seller_id?: string | null; // Tracks who recommended/sold this add-on
}

export function useCheckoutForm() {
  const queryClient = useQueryClient();

  // Form Field States
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleSpecification, setVehicleSpecification] =
    useState<VehicleSpecification>("4-wheels");
  const [selectedSizeObj, setSelectedSizeObj] = useState<SizeOption | null>(
    null,
  );
  const [selectedService, setSelectedService] = useState<ServicesData | null>(
    null,
  );

  // Add-Ons with Top-Up Seller support
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOnItem[]>([]);

  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setCustomerName("");
    setContactNumber("");
    setPlateNumber("");
    setVehicleSpecification("4-wheels");
    setSelectedSizeObj(null);
    setSelectedService(null);
    setSelectedAddOns([]);
    setSelectedPromo(null);
    setPaymentMethod(null);
    setSelectedStaff([]);
    setErrors({});
  };

  // Error management helpers
  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Toggle a service and reset size if vehicle type changes
  const toggleService = (service: ServicesData) => {
    if (selectedService?.id === service.id) {
      setSelectedService(null);
      setSelectedSizeObj(null);
    } else {
      setSelectedService(service);
      setSelectedSizeObj(null); // Reset size when service changes
    }
  };

  // Toggle add-ons (adds with null seller_id initially)
  const toggleAddOn = (addon: AddOnsData) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((item) => item.id === addon.id);
      if (exists) {
        return prev.filter((item) => item.id !== addon.id);
      } else {
        return [...prev, { ...addon, seller_id: null }];
      }
    });
  };

  // Update the top-up seller for a specific add-on
  const updateAddOnSeller = (addonId: string, sellerId: string) => {
    setSelectedAddOns((prev) =>
      prev.map((item) =>
        item.id === addonId ? { ...item, seller_id: sellerId || null } : item,
      ),
    );
  };

  // Toggle staff assignment
  const toggleStaffMember = (staffId: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId],
    );
    clearError("staff");
  };

  // Calculate base service price based on selected size option
  const servicePrice = useMemo(() => {
    if (!selectedSizeObj) return 0;
    return Number(selectedSizeObj.price) || 0;
  }, [selectedSizeObj]);

  // Calculate total price including add-ons and discounts from promo
  const totalPrice = useMemo(() => {
    const addonsTotal = selectedAddOns.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );
    let subtotal = servicePrice + addonsTotal;

    if (selectedPromo) {
      if (selectedPromo.discount_type === "percentage") {
        const discount = subtotal * (Number(selectedPromo.value) / 100);
        subtotal -= discount;
      } else {
        subtotal -= Number(selectedPromo.value);
      }
    }

    return Math.max(0, subtotal);
  }, [servicePrice, selectedAddOns, selectedPromo]);

  // Validation before submission
  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!customerName.trim())
      newErrors.customerName = "Customer name is required";
    if (!plateNumber.trim()) newErrors.plateNumber = "Plate number is required";
    if (!selectedService) newErrors.service = "Please select a service";
    if (!paymentMethod)
      newErrors.paymentMethod = "Please select a payment method";
    if (selectedStaff.length === 0)
      newErrors.staff = "Please assign at least one staff member";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const onSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        contact_number: contactNumber,
        plate_number: plateNumber,
        vehicle_classification:
          vehicleSpecification === "4-wheels" ? "4 Wheels" : "2 Wheels",
        vehicle_size: selectedSizeObj?.size || "regular",
        service_id: selectedService?.id,
        service_price: servicePrice,
        add_ons: selectedAddOns.map((addon) => ({
          id: addon.id,
          price: addon.price,
          seller_id: addon.seller_id || null, // ⬅️ Sent to backend database successfully
        })),
        promo: selectedPromo,
        payment_method: paymentMethod,
        staff: selectedStaff,
        total_price: totalPrice,
      };

      await api.post("/api/pos/checkout", payload);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      resetForm();
    } catch (error) {
      console.error("Failed to submit transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // States
    customerName,
    contactNumber,
    plateNumber,
    vehicleSpecification,
    selectedSizeObj,
    selectedService,
    selectedAddOns,
    selectedPromo,
    paymentMethod,
    selectedStaff,
    isSubmitting,
    errors,
    servicePrice,
    totalPrice,

    // Setters & Actions
    setCustomerName,
    setContactNumber,
    setPlateNumber,
    setVehicleSpecification,
    setSelectedSizeObj,
    setSelectedPromo,
    setPaymentMethod,
    toggleService,
    toggleAddOn,
    updateAddOnSeller, // ⬅️ Returned for use in AddOnsStep
    toggleStaffMember,
    clearError,
    onSubmit,
  };
}
