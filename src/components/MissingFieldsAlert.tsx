import { AlertTriangle } from "lucide-react";

interface MissingFieldsAlertProps {
  fields: string[];
}

/** Shown when a print is blocked because required fields are empty. */
const MissingFieldsAlert = ({ fields }: MissingFieldsAlertProps) => {
  if (!fields.length) return null;
  return (
    <div className="flex gap-2 rounded-lg border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">Printimi u ndal — plotësoni fushat e mëposhtme:</p>
        <ul className="mt-1 list-disc pl-4">
          {fields.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MissingFieldsAlert;
