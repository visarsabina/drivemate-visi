import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, ArrowRight } from "lucide-react";

const CHOICE_KEY = "visitor-offer-choice";

interface VisitorOfferDialogProps {
  /** Controlled open state from parent. */
  open: boolean;
  /** Called when the visitor chooses to enter the main site (close). */
  onOpenChange: (open: boolean) => void;
}

const VisitorOfferDialog = ({ open, onOpenChange }: VisitorOfferDialogProps) => {
  const navigate = useNavigate();

  const handleTest = () => {
    localStorage.setItem(CHOICE_KEY, "test");
    onOpenChange(false);
    navigate("/provo-test");
  };

  const handleEnterSite = () => {
    localStorage.setItem(CHOICE_KEY, "site");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleEnterSite(); }}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Gift className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Fitoni zbritje ekskluzive!</DialogTitle>
          <DialogDescription>
            Dëshironi të provoni një test të shpejtë rrugësh? Nëse e kaloni, fitoni{" "}
            <strong className="text-foreground">20% zbritje</strong> në regjistrimin online.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Button
            size="lg"
            className="w-full justify-between"
            onClick={handleTest}
          >
            <span>Bëj testin për zbritje</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={handleEnterSite}
          >
            Hyr në faqën kryesore
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <p className="text-xs text-muted-foreground text-center">
            Testi zgjat vetëm 2-3 minuta dhe nuk kërkon regjistrim.
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
