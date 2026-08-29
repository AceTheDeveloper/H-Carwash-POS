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

function InclusionSheet() {
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
        </SheetHeader>

        <div></div>
      </SheetContent>
    </Sheet>
  );
}

export default InclusionSheet;
