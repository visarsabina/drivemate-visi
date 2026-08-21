import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CandidateTests from "@/components/CandidateTests";
import RegistrationDialog from "@/components/RegistrationDialog";

const COUPON_KEY = "visi_demo_coupon";

function generateCoupon() {
  const existing = localStorage.getItem(COUPON_KEY);
  if (existing) return existing;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const coupon = `VISI20-${code}`;
  localStorage.setItem(COUPON_KEY, coupon);
  return coupon;
}

const DemoTest = () => {
  const navigate = useNavigate();
  const [showRegistration, setShowRegistration] = useState(false);
  const [coupon, setCoupon] = useState<string | null>(null);

  return (
    <>
      <CandidateTests
        candidateId="demo-public"
        category="B"
        fixedTestIndex={1}
        onClose={() => navigate("/home")}
        onResult={() => {
          setCoupon(generateCoupon());
          setShowRegistration(true);
        }}
      />

      <RegistrationDialog
        open={showRegistration}
        onOpenChange={setShowRegistration}
        defaultCategory="B"
        couponCode={coupon ?? undefined}
        promoNote="Faleminderit që provove testin! Ky kod zbritjeje është vetëm për ju – regjistrohu online dhe përfito 20% zbritje."
      />
    </>
  );
};

export default DemoTest;
