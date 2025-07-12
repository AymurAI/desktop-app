import { useEffect } from "react";

import { useFileDispatch } from "@/hooks";
import { addParagraphs } from "@/reducers/file/actions";
import { documentExtractSchema } from "@/schema/extract";

import api from "../api";
import { useSchemedQuery } from "../utils";

export function useFileParser(file: File) {
  const dispatch = useFileDispatch();

  const query = useSchemedQuery({
    queryKey: ["file-parser", file.name],
    queryFn: async () => {
      const formData = new FormData();
      formData.append("file", file);

      return api.post("/document/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    schema: documentExtractSchema,
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      // TODO: remove redux in the future
      dispatch(
        addParagraphs(
          // Convert structure for backwards compatibility
          query.data.paragraphs.map((p) => ({
            value: p.text,
            document_id: query.data.id,
            id: p.id,
          })),
          file.name,
        ),
      );
    }
  }, [query.isSuccess]);

  return query;
}
