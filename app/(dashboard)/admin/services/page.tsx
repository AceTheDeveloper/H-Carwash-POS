import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
export default function ServicesPage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl text-primary font-semibold leading-none">
          Services Management
        </h1>
        <p className="leading-none text-secondary mt-2 font-semibold">
          Manage your services
        </p>
      </div>

      {/* Main Section maybe tables */}
      <main>
        {/* Search and filter section */}
        <div>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <div className="bg-background rounded-md overflow-hidden flex items-center justify-center pr-2">
                <Input
                  placeholder="Search for services here"
                  className="bg-transparent focus-visible:ring-0 focus-visible:border-0"
                />
                <Search className="text-slate-500" size={20} />
              </div>
            </div>
            <div>upcoming</div>
            <div></div>
          </div>
        </div>
      </main>
    </div>
  );
}
