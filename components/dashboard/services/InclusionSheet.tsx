import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InclusionData } from "@/types/InclusionData";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import InclusionDialog from "./InclusionDialog";
import InclusionCard from "./InclusionCard";

interface Props {
  inclusions: InclusionData[];
  isLoading: boolean;
}

function InclusionSheet({ inclusions, isLoading }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Sheet>
      <SheetTrigger>
        <Button
          variant="outline"
          className="bg-background border-border h-10 text-xs md:text-sm"
        >
          <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
          Manage Inclusions
        </Button>
      </SheetTrigger>
      <SheetContent className={"border-none rounded-tl-lg rounded-bl-lg"}>
        <SheetHeader>
          <SheetTitle>Inclusion List</SheetTitle>

          {!isLoading && (
            <section>
              {/* Main Section here */}

              <div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input placeholder="Search Inclusions here" />
                  </div>
                  <div>
                    <Button onClick={() => setIsOpen(true)}>
                      <Plus className="text-white" />
                    </Button>
                  </div>
                </div>
              </div>
              {inclusions.length === 0 ? (
                <p className="text-slate-300 text-center mt-2">
                  No Inclusions yet
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {inclusions.map((item, index) => (
                    <div key={item.id || index}>
                      <InclusionCard label={item.label} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </SheetHeader>
      </SheetContent>

      {/*  */}
      <InclusionDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </Sheet>
  );
}

export default InclusionSheet;
