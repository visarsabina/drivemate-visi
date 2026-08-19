import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const OVERRIDE_BUCKET = "question-images";
const OPTION_KEYS = ["A", "B", "C", "D", "E"];

export type QuestionTextOverride = {
  text?: string | null;
  options?: string[] | null;
  correctKey?: string | null;
};

/**
 * Loads super-admin overrides for question images (storage bucket) and
 * question text/options (question_overrides table). Readable by anyone,
 * so it also works on the public demo test.
 */
export const useQuestionOverrides = () => {
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [textMap, setTextMap] = useState<Record<string, QuestionTextOverride>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Images
      const { data: files } = await supabase.storage.from(OVERRIDE_BUCKET).list("", { limit: 1000 });
      if (!cancelled && files && files.length > 0) {
        const names = files.map((f) => f.name);
        const { data: signed } = await supabase.storage
          .from(OVERRIDE_BUCKET)
          .createSignedUrls(names, 60 * 60 * 8);
        if (!cancelled && signed) {
          const map: Record<string, string> = {};
          signed.forEach((s) => {
            if (!s.path || !s.signedUrl) return;
            map[s.path.replace(/\.[^.]+$/, "")] = s.signedUrl;
          });
          setImageMap(map);
        }
      }

      // Text / options
      const { data: rows } = await (supabase as any)
        .from("question_overrides")
        .select("question_id, text, options, correct_key");
      if (!cancelled && rows) {
        const map: Record<string, QuestionTextOverride> = {};
        rows.forEach((r: any) => {
          map[r.question_id] = {
            text: r.text,
            options: Array.isArray(r.options) ? (r.options as string[]) : null,
            correctKey: r.correct_key,
          };
        });
        setTextMap(map);
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { imageMap, textMap, loaded, OPTION_KEYS };
};
