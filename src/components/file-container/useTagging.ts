import { useState } from 'react';
import {
  GroupedPredictions,
  groupPredictions,
} from 'services/aymurai/groupPredictions';
import { id as getParagraphId } from 'utils/html/addParagraphId';
import { DocFile } from 'types/file';

interface AddRemoveTag {
  paragraph: string;
  text: string;
  tag: string;
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

  const addTag = ({ paragraph, text, tag }: AddRemoveTag) => {
    const id = getParagraphId(paragraph);
    const index = paragraph.indexOf(text);

    const newTag = { text, tag, index };

    if (tags.has(id)) {
      const currentTags = tags.get(id) ?? [];
      const sorted = [...currentTags, newTag].sort((a, b) => a.index - b.index);

      setTags(new Map(tags).set(id, sorted));
    } else {
      setTags(new Map(tags).set(id, [newTag]));
    }
  };

  const removeTag = ({ paragraph, text, tag }: AddRemoveTag) => {
    const id = getParagraphId(paragraph);

    if (tags.has(id)) {
      const currentTags = tags.get(id) ?? [];
      const filtered = currentTags.filter(
        (t) => t.text !== text && t.tag !== tag
      );

      setTags(new Map(tags).set(id, filtered));
    }
  };

  return { tags, addTag, removeTag };
};
