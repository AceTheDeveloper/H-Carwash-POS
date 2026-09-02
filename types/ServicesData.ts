import { InclusionData } from "./InclusionData";
import { ServiceSizes } from "./ServicesPayload";

export interface ServicesData {
  id: string;
  vehicle_type: "4-wheels" | "2-wheels";
  service_name: string;
  service_price: number;
  inclusions: InclusionData[];
  size: ServiceSizes[];
  created_at: string;
  updated_at: string;
}
