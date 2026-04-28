import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Instructor {
  user_id: string;
  email: string;
}

interface InstructorPickerProps {
  candidateId: string;
  currentInstructorId?: string | null;
  onChange?: (instructorId: string | null) => void;
}

/**
 * Dropdown that lets an admin assign an instructor to a candidate.
 * The list is fetched once via list_instructors_in_my_tenant() RPC.
 */
const InstructorPicker = ({ candidateId, currentInstructorId, onChange }: InstructorPickerProps) => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [value, setValue] = useState<string>(currentInstructorId ?? "none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(currentInstructorId ?? "none");
  }, [currentInstructorId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("list_instructors_in_my_tenant");
      if (!cancelled && !error) {
        setInstructors((data as Instructor[]) ?? []);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = async (newVal: string) => {
    setSaving(true);
    const newId = newVal === "none" ? null : newVal;
    const { error } = await supabase
      .from("candidates")
      .update({ instructor_id: newId })
      .eq("id", candidateId);
    setSaving(false);
    if (error) {
      toast.error("Gabim: " + error.message);
      return;
    }
    setValue(newVal);
    onChange?.(newId);
    toast.success(newId ? "Instruktori u caktua" : "Instruktori u hoq");
  };

  return (
    <Select value={value} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger className="h-8 w-[160px] text-xs">
        <SelectValue placeholder="Pa instruktor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Pa instruktor</SelectItem>
        {instructors.map((i) => (
          <SelectItem key={i.user_id} value={i.user_id}>
            {i.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default InstructorPicker;
