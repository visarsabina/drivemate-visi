import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
import truckC from "@/assets/truck-c.jpg";

const CHOICE_KEY = "visitor-offer-choice";

interface VisitorOfferDialogProps {
  /** Controlled open state from parent. */
  open: boolean;
  /** Called when the visitor chooses to enter the main site (close). */
  onOpenChange: (open: boolean) => void;
  /** Called when the visitor wants to register — opens the registration form. */
  onRegister: () => void;
}

const VisitorOfferDialog = ({ open, onOpenChange, onRegister }: VisitorOfferDialogProps) => {
  const handleRegister = () => {
    localStorage.setItem(CHOICE_KEY, "register");
    onOpenChange(false);
    onRegister();
  };

  const handleEnterSite = () => {
    localStorage.setItem(CHOICE_KEY, "site");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleEnterSite(); }}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden p-0 overflow-hidden gap-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header: truck photo with dark overlay + logo */}
        <div className="relative h-36 w-full">
          <img
            src={truckC}
            alt="Kamion i kategorisë së rëndë"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={logo}
              alt="AutoShkolla VISI"
              className="h-20 w-auto drop-shadow-lg"
            />
          </div>
        </div>

        <DialogHeader className="text-center px-6 pt-4">
          <DialogTitle className="text-xl leading-tight">
            OFERTË SPECIALE PËR KATEGORITË E RËNDA
          </DialogTitle>
          <DialogDescription className="text-base">
            Bëhu shofer profesionist!
          </DialogDescription>
        </DialogHeader>

        {/* Price block */}
        <div className="px-6 py-3 space-y-2 text-center">
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-sm text-muted-foreground">
              Çmimi i rregullt: <del>300€</del>
            </span>
            <span className="text-2xl font-bold text-primary">200€</span>
          </div>
          <div className="inline-block rounded-full bg-destructive px-4 py-1 text-sm font-bold text-destructive-foreground">
            KURSE 100€!
          </div>
          <p className="text-sm font-medium pt-1">
            Kategoritë: <strong>C1</strong> | <strong>C</strong> | <strong>CE</strong> | <strong>D</strong>
          </p>
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Oferta vlen deri më 28 Nëntor!
          </p>
        </div>

        <div className="space-y-2 px-6 pb-4">
          <Button
            size="lg"
            className="w-full justify-between"
            onClick={handleRegister}
          >
            <span>REGJISTROHU TANI</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <button
            type="button"
            onClick={handleEnterSite}
            className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Vazhdo në faqen kryesore
          </button>
        </div>

        <DialogFooter className="sm:justify-center px-6 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            Regjistrimi është falas dhe nuk ju detyron në pagesë.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const useVisitorOffer = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show until the visitor actually picks one of the two options.
    if (localStorage.getItem(CHOICE_KEY)) return;

    const t = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return { open, setOpen };
};

export default VisitorOfferDialog;
