import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NEPAL_SUBJECTS } from "@/lib/constants";

export function useSubjectCategories() {
  return useQuery({
    queryKey: ["subject-categories"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc("get_subject_categories" as never);
      if (error) throw error;
      return Array.isArray(data) ? data as string[] : NEPAL_SUBJECTS;
    },
    initialData: NEPAL_SUBJECTS,
    staleTime: 0,
  });
}