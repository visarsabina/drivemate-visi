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
        fixedTestIndex={1}
        onClose={() => navigate("/home")}
        onResult={() => setShowRegistration(true)}
      />

      <RegistrationDialog
        open={showRegistration}
        onOpenChange={setShowRegistration}
        defaultCategory="B"
        promoNote="Faleminderit që provove testin! Regjistrohu online tani dhe përfito 20% zbritje."
      />
    </>
  );
};

export default DemoTest;
