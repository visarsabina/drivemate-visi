import { useNavigate } from "react-router-dom";
import CandidateTests from "@/components/CandidateTests";

const DemoTest = () => {
  const navigate = useNavigate();
  return (
    <CandidateTests
      candidateId="demo-public"
      category="B"
      autoStartRandom
      onClose={() => navigate("/home")}
    />
  );
};

export default DemoTest;
