"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Car,
  Bike,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Droplets,
  Flame,
  Wrench,
  Layers,
  Plus,
  Check,
  ChevronUp,
} from "lucide-react";

import HLogo from "@/assets/h_final_logo.png";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CAR_SIZES = [
  { id: "s", label: "Small", sub: "S" },
  { id: "m", label: "Medium", sub: "M" },
  { id: "l", label: "Large", sub: "L" },
  { id: "xl", label: "Extra Large", sub: "XL" },
];

const MOTOR_SIZES = [
  { id: "r", label: "Regular", sub: "R" },
  { id: "bb", label: "Big Bike", sub: "BB" },
];

const CAR_SERVICES = [
  {
    id: "c1",
    label: "Basic",
    price: 20,
    icon: Droplets,
    inclusions: ["Carwash", "Vacuum", "Tireblack"],
  },
  {
    id: "c2",
    label: "Advanced",
    price: 35,
    icon: Sparkles,
    inclusions: ["Carwash", "Vacuum", "Armor All", "Tireblack"],
  },
  {
    id: "c3",
    label: "Premium",
    price: 50,
    icon: ShieldCheck,
    inclusions: ["Carwash", "Vacuum", "Armor All", "Wax", "Tireblack"],
  },
];

const MOTOR_SERVICES = [
  {
    id: "m1",
    label: "Basic",
    price: 15,
    icon: Droplets,
    inclusions: ["Wash Only"],
  },
  {
    id: "m2",
    label: "Advanced",
    price: 25,
    icon: Sparkles,
    inclusions: ["Wash", "Wax"],
  },
];

const ADD_ONS = [
  {
    id: "a1",
    label: "Armor All",
    price: 20,
    icon: ShieldCheck,
  },
  {
    id: "a2",
    label: "Back-to-zero",
    price: 35,
    icon: Flame,
  },
  {
    id: "a3",
    label: "Engine Wash",
    price: 50,
    icon: Wrench,
  },
  {
    id: "a4",
    label: "Asphalt Removal",
    price: 50,
    icon: Layers,
  },
];

export default function POSScreen() {
  const [vehicleType, setVehicleType] = useState<"4-wheels" | "2-wheels">(
    "4-wheels",
  );
  const [selectedSize, setSelectedSize] = useState<string>("m");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("c1");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [showMobileOrderSlip, setShowMobileOrderSlip] = useState(false);

  // Dynamic lists based on classification
  const activeSizesList = vehicleType === "4-wheels" ? CAR_SIZES : MOTOR_SIZES;
  const activeServicesList =
    vehicleType === "4-wheels" ? CAR_SERVICES : MOTOR_SERVICES;

  // Selected Service
  const activeService =
    activeServicesList.find((s) => s.id === selectedServiceId) ||
    activeServicesList[0];

  // Selected Add-ons
  const activeAddOns = ADD_ONS.filter((addon) =>
    selectedAddOnIds.includes(addon.id),
  );

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleVehicleTypeChange = (type: "4-wheels" | "2-wheels") => {
    setVehicleType(type);
    setSelectedSize(type === "4-wheels" ? "m" : "r");
    setSelectedServiceId(type === "4-wheels" ? "c1" : "m1");
  };

  const totalAmount =
    (activeService?.price || 0) +
    activeAddOns.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[var(--color-background)] p-3 sm:p-6 overflow-x-hidden lg:overflow-hidden text-[var(--color-text-primary)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-4 sm:gap-6 max-w-7xl pb-20 lg:pb-0">
        {/* Main Content Column */}
        <div className="lg:col-span-8 bg-[var(--color-surface)] rounded-xl shadow-xs border border-[var(--color-border)] p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              New Service Order
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Select classification, options, and packages below.
            </p>
          </div>

          <form
            action="#"
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6"
          >
            {/* Customer Details */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-secondary)]">
                Customer Details
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="contact"
                    className="text-xs text-[var(--color-text-secondary)]"
                  >
                    Contact Number
                  </Label>
                  <Input
                    id="contact"
                    placeholder="e.g. +61 400 000 000"
                    className="border-[var(--color-border)] focus-visible:ring-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="plate"
                    className="text-xs text-[var(--color-text-secondary)]"
                  >
                    Plate Number
                  </Label>
                  <Input
                    id="plate"
                    placeholder="e.g. ABC 1234"
                    className="uppercase border-[var(--color-border)] focus-visible:ring-[var(--color-primary)]"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <Label
                    htmlFor="name"
                    className="text-xs text-[var(--color-text-secondary)]"
                  >
                    Customer Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="border-[var(--color-border)] focus-visible:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Classification */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-secondary)]">
                Vehicle Classification
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Card
                  className={`cursor-pointer transition-all border-2 ${
                    vehicleType === "4-wheels"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-xs"
                      : "border-[var(--color-border)] hover:border-[var(--color-secondary-light)]"
                  }`}
                  onClick={() => handleVehicleTypeChange("4-wheels")}
                >
                  <CardContent className="flex items-center justify-center gap-3 p-3 sm:p-4">
                    <Car
                      className={`size-5 ${
                        vehicleType === "4-wheels"
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-text-secondary)]"
                      }`}
                    />
                    <span className="font-semibold text-xs sm:text-sm">
                      4 Wheels
                    </span>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all border-2 ${
                    vehicleType === "2-wheels"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-xs"
                      : "border-[var(--color-border)] hover:border-[var(--color-secondary-light)]"
                  }`}
                  onClick={() => handleVehicleTypeChange("2-wheels")}
                >
                  <CardContent className="flex items-center justify-center gap-3 p-3 sm:p-4">
                    <Bike
                      className={`size-5 ${
                        vehicleType === "2-wheels"
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-text-secondary)]"
                      }`}
                    />
                    <span className="font-semibold text-xs sm:text-sm">
                      2 Wheels
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Dynamic Vehicle Size */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-secondary)]">
                Vehicle Size
              </Label>
              <RadioGroup
                value={selectedSize}
                onValueChange={setSelectedSize}
                className={`grid gap-2 sm:gap-3 ${
                  activeSizesList.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-4"
                }`}
              >
                {activeSizesList.map((size) => (
                  <div key={size.id}>
                    <RadioGroupItem
                      value={size.id}
                      id={`size-${size.id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`size-${size.id}`}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 sm:p-3 hover:bg-[var(--color-background)] peer-data-[state=checked]:border-[var(--color-primary)] peer-data-[state=checked]:bg-[var(--color-primary)]/5 cursor-pointer transition-all text-center"
                    >
                      <span className="font-semibold text-xs sm:text-sm">
                        {size.label}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide">
                        ({size.sub})
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Dynamic Services Section */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-secondary)]">
                Service Package (
                {vehicleType === "4-wheels" ? "4 Wheels" : "2 Wheels"})
              </Label>
              <div
                className={`grid grid-cols-1 ${
                  activeServicesList.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-3"
                } gap-3`}
              >
                {activeServicesList.map((item) => {
                  const isSelected = selectedServiceId === item.id;
                  const Icon = item.icon;
                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all border-2 relative overflow-hidden ${
                        isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-xs"
                          : "border-[var(--color-border)] hover:border-[var(--color-secondary-light)]"
                      }`}
                      onClick={() => setSelectedServiceId(item.id)}
                    >
                      <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full gap-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-[var(--color-background)] text-[var(--color-primary)]">
                              <Icon className="size-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)] leading-none">
                                {item.label}
                              </h4>
                              <span className="text-xs font-bold text-[var(--color-primary)] mt-1 inline-block">
                                ${item.price}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="size-4 text-[var(--color-primary)] shrink-0" />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {item.inclusions.map((inc, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] font-normal"
                            >
                              {inc}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Add-Ons Section */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-secondary)]">
                Optional Add-ons
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADD_ONS.map((addon) => {
                  const isSelected = selectedAddOnIds.includes(addon.id);
                  const Icon = addon.icon;
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddOn(addon.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                          : "border-[var(--color-border)] hover:border-[var(--color-secondary-light)] bg-[var(--color-surface)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-md ${
                            isSelected
                              ? "bg-[var(--color-primary)] text-white"
                              : "bg-[var(--color-background)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                            {addon.label}
                          </p>
                          <p className="text-xs font-bold text-[var(--color-primary-light)]">
                            +${addon.price}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`size-5 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                            : "border-[var(--color-border)] text-transparent"
                        }`}
                      >
                        <Check className="size-3 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Desktop Sidebar Slip Container */}
        <div className="hidden lg:flex lg:col-span-4 bg-[var(--color-surface)] rounded-xl shadow-xs border border-[var(--color-border)] p-6 flex-col justify-between">
          <OrderSlipContent
            activeService={activeService}
            activeAddOns={activeAddOns}
            vehicleType={vehicleType}
            totalAmount={totalAmount}
          />
        </div>
      </div>

      {/* Mobile Floating Slip Tray */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">
              Total Amount
            </p>
            <p className="text-xl font-bold text-[var(--color-primary)]">
              ${totalAmount.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileOrderSlip(!showMobileOrderSlip)}
              className="border-[var(--color-border)]"
            >
              <Receipt className="size-4 mr-1.5" />
              Slip
              <ChevronUp
                className={`size-4 ml-1 transition-transform ${
                  showMobileOrderSlip ? "rotate-180" : ""
                }`}
              />
            </Button>
            <Button
              size="sm"
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
            >
              Checkout
            </Button>
          </div>
        </div>

        {/* Mobile Expanded Drawer */}
        {showMobileOrderSlip && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)] max-h-[60vh] overflow-y-auto space-y-4">
            <OrderSlipContent
              activeService={activeService}
              activeAddOns={activeAddOns}
              vehicleType={vehicleType}
              totalAmount={totalAmount}
              isMobile
            />
          </div>
        )}
      </div>
    </div>
  );
}

{
  /* Order Slip Display Helper Component */
}
function OrderSlipContent({
  activeService,
  activeAddOns,
  vehicleType,
  totalAmount,
  isMobile = false,
}: {
  activeService: any;
  activeAddOns: any[];
  vehicleType: string;
  totalAmount: number;
  isMobile?: boolean;
}) {
  return (
    <div className="flex flex-col h-full justify-between gap-6">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-[var(--color-border)]">
          <Image
            src={HLogo}
            alt="H Logo"
            className="size-10 sm:size-12 rounded-lg object-cover border border-[var(--color-border)] shrink-0"
          />
          <div>
            <h3 className="font-semibold text-sm sm:text-base leading-none text-[var(--color-text-primary)]">
              Service Slip
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              POS Terminal
            </p>
          </div>
        </div>

        {activeService ? (
          <div className="space-y-3">
            <div className="bg-[var(--color-background)] rounded-lg p-3.5 border border-[var(--color-border)] space-y-3">
              <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs sm:text-sm text-[var(--color-text-primary)]">
                    {activeService.label} Package
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] capitalize border-[var(--color-border)]"
                  >
                    {vehicleType}
                  </Badge>
                </div>
                <span className="font-bold text-xs sm:text-sm text-[var(--color-primary)]">
                  ${activeService.price}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                  Inclusions
                </p>
                <ul className="space-y-1">
                  {activeService.inclusions.map((inc: string, i: number) => (
                    <li
                      key={i}
                      className="text-xs text-[var(--color-text-primary)] flex items-center gap-1.5"
                    >
                      <ShieldCheck className="size-3.5 text-[var(--color-success)] shrink-0" />
                      {inc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {activeAddOns.length > 0 && (
              <div className="bg-[var(--color-background)] rounded-lg p-3.5 border border-[var(--color-border)] space-y-2">
                <p className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Selected Add-ons
                </p>
                {activeAddOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex justify-between items-center text-xs text-[var(--color-text-primary)]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus className="size-3 text-[var(--color-primary)]" />
                      {addon.label}
                    </span>
                    <span className="font-semibold text-[var(--color-primary-light)]">
                      +${addon.price}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center text-[var(--color-text-secondary)] gap-2">
            <Receipt className="size-10 stroke-[1.5]" />
            <p className="text-xs">No services selected.</p>
          </div>
        )}
      </div>

      {!isMobile && (
        <div className="border-t border-[var(--color-border)] pt-4 space-y-4">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-[var(--color-text-secondary)]">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-[var(--color-primary)]">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
          <Button
            className="w-full font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
            size="lg"
          >
            Complete Order
          </Button>
        </div>
      )}
    </div>
  );
}
