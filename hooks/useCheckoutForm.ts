import { AddOnsData } from "@/types/AddOnsData";
import {
  FormErrors,
  PaymentMethod,
  SizeOption,
  VehicleSpecification,
} from "@/types/Checkout";
import { PromoData } from "@/types/PromoData";
import { ServicesData } from "@/types/ServicesData";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import handleOrderId from "@/app/api/helpers/handle_order_id";
import useDrafts from "@/hooks/useDrafts";

export interface SelectedAddOnItem extends AddOnsData {
  seller_id?: string | null;
  /** True when this line was added automatically by a promo (free add-on
   *  or bundle-price add-on), rather than picked by the cashier. */
  is_promo_item?: boolean;
  /** The promo that granted this item, when is_promo_item is true. */
  promo_id?: string;
}

// Shape returned from the `drafts` table (snake_case, matches DB columns)
export interface DraftRow {
  id: string;
  customer_name: string;
  contact_number: string;
  plate_number: string;
  car_brand: string;
  vehicle_specification: VehicleSpecification;
  selected_size_obj: SizeOption | null;
  selected_service: ServicesData | null;
  selected_add_ons: SelectedAddOnItem[];
  selected_promo: PromoData | null;
  payment_method: PaymentMethod | null;
  selected_staff: string[];
  total_price: number;
  order_id: string;
  saved_at: string;
  updated_at: string;
}

export function useCheckoutForm() {
  const queryClient = useQueryClient();
  const { data: draftsData } = useDrafts();
  const drafts: DraftRow[] = draftsData ?? [];

  // Form Field States
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [carBrand, setCarBrand] = useState("");
  const [vehicleSpecification, setVehicleSpecification] =
    useState<VehicleSpecification>("4-wheels");
  const [selectedSizeObj, setSelectedSizeObj] = useState<SizeOption | null>(
    null,
  );
  const [selectedService, setSelectedService] = useState<ServicesData | null>(
    null,
  );
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOnItem[]>([]);
  const [selectedPromo, setSelectedPromoState] = useState<PromoData | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [orderID, setOrderID] = useState<string>("");

  async function getOrderID() {
    const number = await handleOrderId();
    setOrderID(number);
  }

  useEffect(() => {
    getOrderID();
  }, []);

  const resetForm = (options?: { refreshOrderId?: boolean }) => {
    const { refreshOrderId = true } = options ?? {};

    setCustomerName("");
    setContactNumber("");
    setPlateNumber("");
    setCarBrand("");
    setVehicleSpecification("4-wheels");
    setSelectedSizeObj(null);
    setSelectedService(null);
    setSelectedAddOns([]);
    setSelectedPromoState(null);
    setPaymentMethod(null);
    setSelectedStaff([]);
    setCurrentDraftId(null);
    setErrors({});

    if (refreshOrderId) {
      getOrderID();
    }
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleService = (service: ServicesData) => {
    if (selectedService?.id === service.id) {
      setSelectedService(null);
      setSelectedSizeObj(null);
    } else {
      setSelectedService(service);
      setSelectedSizeObj(null);
    }
  };

  const toggleAddOn = (addon: AddOnsData) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((item) => item.id === addon.id);
      // Promo-granted items can't be manually removed — they disappear
      // automatically when the promo itself is deselected (see applyPromo).
      if (exists?.is_promo_item) return prev;
      if (exists) return prev.filter((item) => item.id !== addon.id);
      return [...prev, { ...addon, seller_id: null }];
    });
  };

  // Applying a promo does two things at once:
  //  1. Sets it as the active promo (used for the % / fixed discount math).
  //  2. If it's a "free add-on" or "bundle price" promo, drops the reward
  //     add-on straight into the cart at the right price (0, or the bundle
  //     price) so it shows up in Order Summary and gets billed correctly.
  // Swapping to a different promo, or clearing it, removes any previously
  // auto-added reward item first.
  const applyPromo = (promo: PromoData | null) => {
    setSelectedAddOns((prev) => {
      const withoutReward = prev.filter((item) => !item.is_promo_item);

      if (!promo || promo.promo_type === "discount" || !promo.reward_add_on) {
        return withoutReward;
      }

      const rewardPrice =
        promo.promo_type === "free_add_on"
          ? 0
          : Number(promo.reward_price ?? 0);

      return [
        ...withoutReward,
        {
          ...promo.reward_add_on,
          price: rewardPrice,
          seller_id: null,
          is_promo_item: true,
          promo_id: promo.id,
        },
      ];
    });

    setSelectedPromoState(promo);
  };

  const updateAddOnSeller = (addonId: string, sellerId: string) => {
    setSelectedAddOns((prev) =>
      prev.map((item) =>
        item.id === addonId ? { ...item, seller_id: sellerId || null } : item,
      ),
    );
  };

  const toggleStaffMember = (staffId: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId],
    );
    clearError("staff");
  };

  const servicePrice = useMemo(() => {
    if (!selectedSizeObj) return 0;
    return Number(selectedSizeObj.price) || 0;
  }, [selectedSizeObj]);

  const totalPrice = useMemo(() => {
    const addonsTotal = selectedAddOns.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );
    let subtotal = servicePrice + addonsTotal;

    // Only "discount" promos subtract from the subtotal. Reward promos
    // (free add-on / bundle price) already show up correctly because the
    // reward item itself was added at the right price in applyPromo above.
    if (selectedPromo && selectedPromo.promo_type === "discount") {
      if (selectedPromo.discount_type === "percentage") {
        subtotal -= subtotal * (Number(selectedPromo.value) / 100);
      } else {
        subtotal -= Number(selectedPromo.value);
      }
    }

    return Math.max(0, subtotal);
  }, [servicePrice, selectedAddOns, selectedPromo]);

  const canSaveDraft = !!selectedService || selectedAddOns.length > 0;

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
    if (!orderID.trim()) newErrors.orderID = "Order ID is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save (or update) the current form as a draft — now written to Supabase
  // so it's visible on every terminal, not just this browser.
  const onSaveDraft = async () => {
    if (!canSaveDraft || isSavingDraft) return;

    setIsSavingDraft(true);
    try {
      const row = {
        customer_name: customerName,
        contact_number: contactNumber,
        plate_number: plateNumber,
        car_brand: carBrand,
        vehicle_specification: vehicleSpecification,
        selected_size_obj: selectedSizeObj,
        selected_service: selectedService,
        selected_add_ons: selectedAddOns,
        selected_promo: selectedPromo,
        payment_method: paymentMethod,
        selected_staff: selectedStaff,
        total_price: totalPrice,
        order_id: orderID,
        updated_at: new Date().toISOString(),
      };

      if (currentDraftId) {
        const { error } = await supabase
          .from("drafts")
          .update(row)
          .eq("id", currentDraftId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("drafts").insert(row);
        if (error) throw new Error(error.message);
      }

      await queryClient.invalidateQueries({ queryKey: ["drafts"] });
      resetForm();
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Load a specific draft by id into the form (used by "Resume" in the Drafts tab)
  const loadDraft = (id: string) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;

    setCustomerName(draft.customer_name ?? "");
    setContactNumber(draft.contact_number ?? "");
    setPlateNumber(draft.plate_number ?? "");
    setCarBrand(draft.car_brand ?? "");
    setVehicleSpecification(draft.vehicle_specification ?? "4-wheels");
    setSelectedSizeObj(draft.selected_size_obj ?? null);
    setSelectedService(draft.selected_service ?? null);
    setSelectedAddOns(draft.selected_add_ons ?? []);
    setSelectedPromoState(draft.selected_promo ?? null);
    setPaymentMethod(draft.payment_method ?? null);
    setSelectedStaff(draft.selected_staff ?? []);
    setOrderID(draft.order_id ?? "");
    setCurrentDraftId(draft.id);
    setErrors({});
  };

  // Remove one draft (used by "Discard" in the Drafts tab, and after successful checkout)
  const deleteDraft = async (id: string) => {
    try {
      const { error } = await supabase.from("drafts").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await queryClient.invalidateQueries({ queryKey: ["drafts"] });
      if (currentDraftId === id) setCurrentDraftId(null);
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        order_id: orderID,
        customer_name: customerName,
        contact_number: contactNumber,
        plate_number: plateNumber,
        car_brand: carBrand,
        vehicle_classification:
          vehicleSpecification === "4-wheels" ? "4 Wheels" : "2 Wheels",
        vehicle_size: selectedSizeObj?.size || "regular",
        service_id: selectedService?.id,
        service_price: servicePrice,
        add_ons: selectedAddOns.map((addon) => ({
          id: addon.id,
          price: addon.price,
          seller_id: addon.seller_id || null,
          is_promo_item: addon.is_promo_item || false,
          promo_id: addon.promo_id || null,
        })),
        promo: selectedPromo,
        payment_method: paymentMethod,
        staff: selectedStaff,
        total_price: totalPrice,
      };

      await api.post("/api/pos/checkout", payload);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });

      if (currentDraftId) await deleteDraft(currentDraftId);
      resetForm();
    } catch (error) {
      console.error("Failed to submit transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    customerName,
    contactNumber,
    plateNumber,
    carBrand,
    vehicleSpecification,
    selectedSizeObj,
    selectedService,
    selectedAddOns,
    selectedPromo,
    paymentMethod,
    selectedStaff,
    isSubmitting,
    isSavingDraft,
    canSaveDraft,
    currentDraftId,
    drafts,
    errors,
    servicePrice,
    totalPrice,
    orderID,

    setCustomerName,
    setContactNumber,
    setPlateNumber,
    setCarBrand,
    setVehicleSpecification,
    setSelectedSizeObj,
    setSelectedPromo: applyPromo,
    setPaymentMethod,
    toggleService,
    toggleAddOn,
    updateAddOnSeller,
    toggleStaffMember,
    clearError,
    onSubmit,
    onSaveDraft,
    loadDraft,
    deleteDraft,
    resetForm,
    setOrderID,
  };
}
