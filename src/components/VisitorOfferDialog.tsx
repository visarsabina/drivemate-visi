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

interface VisitorOfferDialogProps {
  /** Controlled open state from parent. */
  open: boolean;
  /** Called when the visitor chooses to enter the main site (close). */
  onOpenChange: (open: boolean) => void;
}

const VisitorOfferDialog = ({ open, onOpenChange }: VisitorOfferDialogProps) => {
  const navigate = useNavigate();

  const handleTest = () => {
    onOpenChange(false);
    navigate("/provo-test");
  };

  const handleEnterSite = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
    const seen = sessionStorage.getItem("visitor-offer-seen");
    if (seen) return;

    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem("visitor-offer-seen", "1");
    }, 2000);

    return () => clearTimeout(t);
  }, []);

  return { open, setOpen };
};

export default VisitorOfferDialog;
