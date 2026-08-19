import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CandidateTests from "@/components/CandidateTests";
import RegistrationDialog from "@/components/RegistrationDialog";
import { Card } from "@/components/ui/card";
import { PartyPopper } from "lucide-react";

const DemoTest = () => {
  const navigate = useNavigate();
  const [showRegistration, setShowRegistration] = useState(false);

  return (
    <>
      <CandidateTests
        candidateId="demo-public"
        category="B"
        fixedTestIndex={0}
        onClose={() => navigate("/home")}
        onResult={(r) => {
          if (r.passed) setShowRegistration(true);
        }}
      />

      {showRegistration && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
          <Card className="p-4 border-2 border-emerald-500 bg-background shadow-lg flex items-start gap-3">
            <PartyPopper className="w-6 h-6 text-emerald-500 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Urime! Ke kaluar testin.</p>
              <p className="text-muted-foreground">
                Regjistrohu online tani dhe përfito <strong>10% zbritje</strong>.
              </p>
            </div>
          </Card>
        </div>
      )}

      <RegistrationDialog
        open={showRegistration}
        onOpenChange={setShowRegistration}
        defaultCategory="B"
      />
    </>
  );
};

export default DemoTest;
