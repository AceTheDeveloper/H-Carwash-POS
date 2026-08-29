import React from "react";
import ServicesTable from "@/components/dashboard/services/ServicesTable";
import ServicesPageClient from "@/components/dashboard/services/ServicesPage";
function ServicePage() {
  return (
    <ServicesPageClient>
      <ServicesTable />
    </ServicesPageClient>
  );
}

export default ServicePage;
