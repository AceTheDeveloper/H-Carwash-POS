"use client";

import { useState } from "react";
import useServices from "@/hooks/useServices";
import useAddOns from "@/hooks/useAddOns";
import useTransactions from "@/hooks/useTransactions";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import { ServicesData } from "@/types/ServicesData";
import { AddOnsData } from "@/types/AddOnsData";
import { StaffMember } from "@/types/Checkout";

import CustomerInfoForm from "@/components/pos/checkout/CustomerInfoForm";
import VehicleTypeStep from "@/components/pos/checkout/VehicleTypeStep";
import ServiceStep from "@/components/pos/checkout/ServiceStep";
import AddOnsStep from "@/components/pos/checkout/AddOnsStep";
import PaymentMethodStep from "@/components/pos/checkout/PaymentMethodStep";
import StaffStep from "@/components/pos/checkout/StaffStep";
import OrderSummary from "@/components/pos/checkout/OrderSummary";
import QueueSheet from "@/components/pos/checkout/QueueSheet";
import { useQueryClient } from "@tanstack/react-query";
import { useTransactionsRealtime } from "@/hooks/useTransactionsRealtime";

const staffList: StaffMember[] = [
  { id: "staff_1", name: "Alex Reyes" },
  { id: "staff_2", name: "Marco Santos" },
  { id: "staff_3", name: "Junjun Cruz" },
  { id: "staff_4", name: "Nico Bautista" },
];

export default function Page() {
  const { data: services, isLoading: isServicesLoading } = useServices();
  const { data: addOnsData, isLoading: isAddOnsLoading } = useAddOns();
  const queryClient = useQueryClient();
  const { data: transactionsData, isLoading: isTransactionsLoading } =
    useTransactions("pending,in_progress");
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const form = useCheckoutForm();

  useTransactionsRealtime();

  const addOnsList: AddOnsData[] =
    addOnsData?.json?.data ||
    addOnsData?.data ||
    (Array.isArray(addOnsData) ? addOnsData : []);

  const queueList = transactionsData?.data || transactionsData || [];

  if (isServicesLoading || isAddOnsLoading) return null;

  const servicesToRender: ServicesData[] =
    services?.filter(
      (service: ServicesData) =>
        service.vehicle_type === form.vehicleSpecification,
    ) || [];

  const canSubmit = !!form.selectedService && !!form.selectedSizeObj;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6 font-sans">
      <main className="max-w-[1450px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <section className="flex-1 flex flex-col gap-8 pb-10">
            <div className="pb-2 border-b border-border/50 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  New Transaction
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill out each step below to create an order.
                </p>
              </div>
              <QueueSheet
                open={isQueueOpen}
                onOpenChange={setIsQueueOpen}
                queueList={queueList}
                isLoading={isTransactionsLoading}
                onStatusChanged={() =>
                  queryClient.invalidateQueries({ queryKey: ["transactions"] })
                }
              />
            </div>

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
              isSubmitting={form.isSubmitting}
              onToggle={form.toggleAddOn}
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
              staffList={staffList}
              selectedStaff={form.selectedStaff}
              error={form.errors.staff}
              onToggle={form.toggleStaffMember}
            />
          </section>

          <section className="w-full lg:w-[380px] xl:w-[420px] shrink-0 order-first lg:order-last mb-6 lg:mb-0">
            <div className="lg:sticky lg:top-6">
              <OrderSummary
                selectedService={form.selectedService}
                selectedSizeSize={form.selectedSizeObj?.size}
                vehicleSpecification={form.vehicleSpecification}
                servicePrice={form.servicePrice}
                selectedAddOns={form.selectedAddOns}
                paymentMethod={form.paymentMethod}
                selectedStaff={form.selectedStaff}
                staffList={staffList}
                totalPrice={form.totalPrice}
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
