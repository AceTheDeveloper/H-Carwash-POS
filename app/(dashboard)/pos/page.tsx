"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { LogOut, ShieldCheck } from "lucide-react";
import useServices from "@/hooks/useServices";
import useAddOns from "@/hooks/useAddOns";
import useTransactions from "@/hooks/useTransactions";
import usePromos from "@/hooks/usePromos";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import { ServicesData } from "@/types/ServicesData";
import { AddOnsData } from "@/types/AddOnsData";
import { PromoData } from "@/types/PromoData"; // <-- Added

import CustomerInfoForm from "@/components/pos/checkout/CustomerInfoForm";
import VehicleTypeStep from "@/components/pos/checkout/VehicleTypeStep";
import ServiceStep from "@/components/pos/checkout/ServiceStep";
import AddOnsStep from "@/components/pos/checkout/AddOnsStep";
import PromosStep from "@/components/pos/checkout/PromoStep"; // <-- Added
import PaymentMethodStep from "@/components/pos/checkout/PaymentMethodStep";
import StaffStep from "@/components/pos/checkout/StaffStep";
import OrderSummary from "@/components/pos/checkout/OrderSummary";
import QueueSheet from "@/components/pos/checkout/QueueSheet";
import { useQueryClient } from "@tanstack/react-query";
import { useTransactionsRealtime } from "@/hooks/useTransactionsRealtime";
import useStaff from "@/hooks/useStaff";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { signOut } = useClerk();
  const { data: services, isLoading: isServicesLoading } = useServices();
  const { data: addOnsData, isLoading: isAddOnsLoading } = useAddOns();
  const { data: transactionsData, isLoading: isTransactionsLoading } =
    useTransactions("pending,in_progress");
  const { data: promoData, isLoading: isPromoLoading } = usePromos();
  const { data: staffData, isLoading: isStaffDataLoading } = useStaff();
  const queryClient = useQueryClient();

  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const form = useCheckoutForm();

  useTransactionsRealtime();

  const addOnsList: AddOnsData[] =
    addOnsData?.json?.data ||
    addOnsData?.data ||
    (Array.isArray(addOnsData) ? addOnsData : []);

  // Parse and filter promos to only show active ones
  const rawPromoList: PromoData[] =
    promoData?.json?.data ||
    promoData?.data ||
    (Array.isArray(promoData) ? promoData : []);
  const activePromos = rawPromoList.filter((promo) => promo.is_active);

  const queueList = transactionsData?.data || transactionsData || [];

  if (
    isServicesLoading ||
    isAddOnsLoading ||
    isPromoLoading ||
    isStaffDataLoading
  )
    return null;

  const servicesToRender: ServicesData[] =
    services?.filter(
      (service: ServicesData) =>
        service.vehicle_type === form.vehicleSpecification,
    ) || [];

  const canSubmit = !!form.selectedService && !!form.selectedSizeObj;

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1450px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
                H Carwash POS
              </p>
              <p className="truncate text-xs text-muted-foreground">
                New transaction workspace
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <QueueSheet
              open={isQueueOpen}
              onOpenChange={setIsQueueOpen}
              queueList={queueList}
              isLoading={isTransactionsLoading}
              onStatusChanged={() =>
                queryClient.invalidateQueries({ queryKey: ["transactions"] })
              }
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Log out"
              title="Log out"
              onClick={() => signOut({ redirectUrl: "/login" })}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1450px] px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            New Transaction
          </h1>
          <p className="text-sm text-muted-foreground">
            Build an order step by step, then send it to the live queue.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <section className="flex min-w-0 flex-1 flex-col gap-6 pb-8">
            <CustomerInfoForm
              customerName={form.customerName}
              contactNumber={form.contactNumber}
              plateNumber={form.plateNumber}
              errors={form.errors}
              isSubmitting={form.isSubmitting}
              onChangeName={(v) => {
                form.setCustomerName(v);
                form.clearError("customerName");
              }}
              onChangeContact={(v) => {
                form.setContactNumber(v);
                form.clearError("contactNumber");
              }}
              onChangePlate={(v) => {
                form.setPlateNumber(v);
                form.clearError("plateNumber");
              }}
            />

            <VehicleTypeStep
              value={form.vehicleSpecification}
              isSubmitting={form.isSubmitting}
              onChange={form.setVehicleSpecification}
            />

            <ServiceStep
              services={servicesToRender}
              selectedService={form.selectedService}
              selectedSizeObj={form.selectedSizeObj}
              isSubmitting={form.isSubmitting}
              onSelectService={form.toggleService}
              onSelectSize={form.setSelectedSizeObj}
            />

            <AddOnsStep
              addOns={addOnsList}
              selectedAddOns={form.selectedAddOns}
              staffList={staffData} // ⬅️ Pass staff list here
              isSubmitting={form.isSubmitting}
              onToggle={form.toggleAddOn}
              onUpdateSeller={form.updateAddOnSeller} // ⬅️ Ensure your useCheckoutForm hook implements this handler
            />

            {/* Replaced comment with actual Component */}
            <PromosStep
              promos={activePromos}
              selectedPromo={form.selectedPromo} // Note: Ensure this exists in useCheckoutForm
              isSubmitting={form.isSubmitting}
              onSelect={form.setSelectedPromo}
            />

            <PaymentMethodStep
              value={form.paymentMethod}
              error={form.errors.paymentMethod}
              isSubmitting={form.isSubmitting}
              onChange={(method) => {
                form.setPaymentMethod(method);
                form.clearError("paymentMethod");
              }}
            />

            <StaffStep
              staffList={staffData}
              selectedStaff={form.selectedStaff}
              error={form.errors.staff}
              onToggle={form.toggleStaffMember}
            />
          </section>

          <section className="order-first mb-2 w-full shrink-0 lg:order-last lg:w-[380px] xl:w-[420px] lg:mb-0">
            <div className="lg:sticky lg:top-[5.5rem]">
              <OrderSummary
                selectedService={form.selectedService}
                selectedSizeSize={form.selectedSizeObj?.size}
                vehicleSpecification={form.vehicleSpecification}
                servicePrice={form.servicePrice}
                selectedAddOns={form.selectedAddOns}
                selectedPromo={form.selectedPromo} // <-- Pass this to OrderSummary to calculate the discount!
                paymentMethod={form.paymentMethod}
                selectedStaff={form.selectedStaff}
                staffList={staffData}
                totalPrice={form.totalPrice} // <-- Make sure this hook calculates total AFTER promo
                isSubmitting={form.isSubmitting}
                canSubmit={canSubmit}
                onSubmit={form.onSubmit}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
