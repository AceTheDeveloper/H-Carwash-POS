import { InclusionData } from "./InclusionData";

export interface ServicesPayload {
  vehicle_type: "4-wheels" | "2-wheels";
  service_name: string;
  service_price: number;
  inclusions: InclusionData[];
}
