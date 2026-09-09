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
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export interface SelectedAddOnItem extends AddOnsData {
  seller_id?: string | null; // Tracks who recommended/sold this add-on
}

const DRAFT_KEY = "pos-checkout-drafts"; // stores an array of drafts

// Shape of what actually gets persisted to localStorage
export interface DraftShape {
  id: string;
  customerName: string;
  contactNumber: string;
  plateNumber: string;
  carBrand: string;
  vehicleSpecification: VehicleSpecification;
  selectedSizeObj: SizeOption | null;
  selectedService: ServicesData | null;
  selectedAddOns: SelectedAddOnItem[];
  selectedPromo: PromoData | null;
  paymentMethod: PaymentMethod | null;
  selectedStaff: string[];
  totalPrice: number;
  savedAt: string;
}

// Raw read/write helpers — these touch localStorage directly.
// Everything else in the hook should go through the `drafts` state instead,
// so the UI always has a fresh copy without re-reading localStorage on every render.
function readDraftsFromStorage(): DraftShape[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeDraftsToStorage(drafts: DraftShape[]) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Failed to write drafts to localStorage:", error);
  }
}

export function useCheckoutForm() {
  const queryClient = useQueryClient();

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

  // Add-Ons with Top-Up Seller support
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOnItem[]>([]);

  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Live list of drafts, mirrored from localStorage. This is what the UI (Drafts tab) reads.
  const [drafts, setDrafts] = useState<DraftShape[]>([]);
  // Tracks which draft (if any) the current form session originated from,
  // so re-saving updates that entry instead of creating a duplicate.
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Load drafts from localStorage on mount (client-side only)
  useEffect(() => {
    setDrafts(readDraftsFromStorage());
  }, []);

  // Keep drafts in sync across browser tabs/windows (optional but nice for a POS with multiple terminals)
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === DRAFT_KEY) {
        setDrafts(readDraftsFromStorage());
      }
    };
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, []);

  const resetForm = () => {
    setCustomerName("");
    setContactNumber("");
    setPlateNumber("");
    setCarBrand("");
    setVehicleSpecification("4-wheels");
    setSelectedSizeObj(null);
    setSelectedService(null);
    setSelectedAddOns([]);
    setSelectedPromo(null);
    setPaymentMethod(null);
    setSelectedStaff([]);
    setCurrentDraftId(null);
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

  // Whether there's anything worth saving as a draft
  const canSaveDraft = !!selectedService || selectedAddOns.length > 0;

  // Validation before final submission
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

  // Save (or update) the current form as a draft. Multiple drafts can exist
  // at once — one per car currently being washed without payment yet.
  const onSaveDraft = async () => {
    if (!canSaveDraft || isSavingDraft) return;

    setIsSavingDraft(true);
    try {
      const id = currentDraftId ?? crypto.randomUUID();
      const draft: DraftShape = {
        id,
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
        totalPrice,
        savedAt: new Date().toISOString(),
      };

      const current = readDraftsFromStorage();
      const existingIndex = current.findIndex((d) => d.id === id);
      const updated =
        existingIndex >= 0
          ? current.map((d, i) => (i === existingIndex ? draft : d))
          : [...current, draft];

      writeDraftsToStorage(updated);
      setDrafts(updated);
      setCurrentDraftId(id);
      resetForm(); // clears the form after saving — see note below
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

    setCustomerName(draft.customerName ?? "");
    setContactNumber(draft.contactNumber ?? "");
    setPlateNumber(draft.plateNumber ?? "");
    setCarBrand(draft.carBrand ?? "");
    setVehicleSpecification(draft.vehicleSpecification ?? "4-wheels");
    setSelectedSizeObj(draft.selectedSizeObj ?? null);
    setSelectedService(draft.selectedService ?? null);
    setSelectedAddOns(draft.selectedAddOns ?? []);
    setSelectedPromo(draft.selectedPromo ?? null);
    setPaymentMethod(draft.paymentMethod ?? null);
    setSelectedStaff(draft.selectedStaff ?? []);
    setCurrentDraftId(draft.id);
    setErrors({});
  };

  // Remove one draft (used by "Discard" in the Drafts tab, and after successful checkout)
  const deleteDraft = (id: string) => {
    const updated = readDraftsFromStorage().filter((d) => d.id !== id);
    writeDraftsToStorage(updated);
    setDrafts(updated);
    if (currentDraftId === id) setCurrentDraftId(null);
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
        })),
        promo: selectedPromo,
        payment_method: paymentMethod,
        staff: selectedStaff,
        total_price: totalPrice,
      };

      await api.post("/api/pos/checkout", payload);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });

      // A completed, paid transaction shouldn't leave a stale unpaid draft behind
      if (currentDraftId) deleteDraft(currentDraftId);
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

    // Setters & Actions
    setCustomerName,
    setContactNumber,
    setPlateNumber,
    setCarBrand,
    setVehicleSpecification,
    setSelectedSizeObj,
    setSelectedPromo,
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
  };
}
