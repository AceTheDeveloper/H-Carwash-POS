export type VehicleClassification = "4 Wheels" | "2 Wheels"

export type VehicleSize = "small" | "medium" | "large" | "extra large" | "regular" | "big bike"

export interface ServicePackage  {
    id: string,
    label: string,
    price: number,
    icon: string,
    inclusions: string[],
  }

  export interface AddOns
  {
    id: string ,
    label: string,
    price: number,
    icon: string,
  }

export interface POSPayload {
    contact_number : string;
    plate_number : string;
    customer_name : string;
    vehicle_classification : VehicleClassification;
    vehicle_size : VehicleSize,
    service : ServicePackage
    add_ons : AddOns[]
}