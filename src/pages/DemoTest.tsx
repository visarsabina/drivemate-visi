import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CandidateTests from "@/components/CandidateTests";
import RegistrationDialog from "@/components/RegistrationDialog";

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


      <RegistrationDialog
        open={showRegistration}
        onOpenChange={setShowRegistration}
        defaultCategory="B"
        promoNote="Urime! Kalove testin — regjistrohu online tani dhe përfito 10% zbritje."
      />
    </>
  );
};

export default DemoTest;
