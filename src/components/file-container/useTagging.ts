import { useState } from 'react';
import {
  GroupedPredictions,
  groupPredictions,
} from 'services/aymurai/groupPredictions';
import { id as getParagraphId } from 'utils/html/addParagraphId';
import { DocFile } from 'types/file';

interface AddTag {
  paragraph?: string;
  text: string;
  tag: string;
  index: number;
}
interface RemoveTag {
  text: string;
  tag: string;
  paragraphId: string;
  index: number;
}
/**
 * Hook to manage the tagging of the predictions.
 * @param file File with the predictions loaded.
 * @returns An object with the tags, and the functions to add and remove tags.
 */
export const useTagging = (file: DocFile) => {
  const [tags, setTags] = useState<GroupedPredictions>(
    groupPredictions(file.predictions)
  );

  const addTag = ({ paragraph, text, tag, index }: AddTag) => {
    // If the predicted text is not in the document, we don't add the tag
    if (!paragraph) return;

    const id = getParagraphId(paragraph);

    const newTag = { text, tag, index };

    if (tags.has(id)) {
      const currentTags = tags.get(id) ?? [];
      const sorted = [...currentTags, newTag].sort((a, b) => a.index - b.index);

      setTags(new Map(tags).set(id, sorted));
    } else {
      setTags(new Map(tags).set(id, [newTag]));
    }
  };

  const removeTag = ({ paragraphId, text, tag, index }: RemoveTag) => {
    if (tags.has(paragraphId)) {
      const currentTags = tags.get(paragraphId) ?? [];
      const filtered = currentTags.filter(
        (t) => t.text !== text || t.tag !== tag || t.index !== index
      );

      setTags(new Map(tags).set(paragraphId, filtered));
    }
  };

  return { tags, addTag, removeTag };
};
