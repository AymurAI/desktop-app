import { HStack, Stack, styled } from "@/styled/jsx";
import type { AnonymizerLabels } from "@/types/aymurai";
import { useState } from "react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import BaseSwitch from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ANONYMIZER_CATEGORY_NAMES,
  getAnonymizerLabelsForCategory,
} from "@/constants/anonymizer-categories";
import { EXCLUDED_TAGS } from "@/constants/excluded-tags";
import {
  useExcludedTagsConfig,
  useExcludedTagsConfigActions,
} from "@/store/useLocal";
import { css } from "@/styled/css";
import { Label } from "./label";
import LabelManagerSection from "./section";

const tooltipContent = css({
  bg: "action.hover",
  color: "white",
  px: "1.5",
  py: "0.5",
  rounded: "sm",
  fontSize: "[12px]",
  boxShadow: "[none]",
});

interface ToggleProps {
  name: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}
function Switch({ name, value, onToggle }: ToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <styled.div px="4" py="3" bg="bg.secondary" rounded="xs">
          <HStack justify="space-between">
            <styled.span textStyle="label.md.default">{name}</styled.span>
            <BaseSwitch checked={value} onCheckedChange={onToggle} />
          </HStack>
        </styled.div>
      </TooltipTrigger>
      <TooltipContent showArrow={false} className={tooltipContent}>
        Incluir o excluir esta categoría de la anonimización
      </TooltipContent>
    </Tooltip>
  );
}

interface LabelConfigTabProps {
  expandedSections: Record<string, boolean>;
  onSectionOpenChange: (section: string, open: boolean) => void;
}

const EXCLUDED_TERMS_SECTION = "Términos excluidos";

export default function LabelConfigTab({
  expandedSections,
  onSectionOpenChange,
}: LabelConfigTabProps) {
  const { tags: storedTags, words: storedWords } = useExcludedTagsConfig();
  const { setTags, setWords } = useExcludedTagsConfigActions();

  const [toggles, setToggles] = useState<Record<string, boolean>>(
    storedTags ?? EXCLUDED_TAGS,
  );
  const [excludedWords, setExcludedWords] = useState<string[]>(storedWords);
  const [inputValue, setInputValue] = useState("");

  function handleToggle(id: string, value: boolean) {
    const next = { ...toggles, [id]: value };
    setToggles(next);
    setTags(next as Record<AnonymizerLabels, boolean>);
  }

  function handleAddWord() {
    const trimmed = inputValue.trim();
    if (!trimmed || excludedWords.includes(trimmed)) return;
    const next = [...excludedWords, trimmed];
    setExcludedWords(next);
    setWords(next);
    setInputValue("");
  }

  function handleRemoveWord(word: string) {
    const next = excludedWords.filter((w) => w !== word);
    setExcludedWords(next);
    setWords(next);
  }

  return (
    <TooltipProvider>
      <Stack gap="6" align="stretch">
        {ANONYMIZER_CATEGORY_NAMES.map((category, index) => (
          <Stack key={category} gap="4">
            {index > 0 && <styled.hr borderColor="[#BCBAB8]" />}
            <LabelManagerSection
              title={category}
              open={expandedSections[category] ?? true}
              onOpenChange={(open) => onSectionOpenChange(category, open)}
            >
              <Stack>
                {getAnonymizerLabelsForCategory(category).map((label) => (
                  <Switch
                    key={label.id}
                    name={label.text}
                    value={toggles[label.id]}
                    onToggle={(value) => handleToggle(label.id, value)}
                  />
                ))}
              </Stack>
            </LabelManagerSection>
          </Stack>
        ))}
        <styled.hr borderColor="[#BCBAB8]" />
        <LabelManagerSection
          title={EXCLUDED_TERMS_SECTION}
          open={expandedSections[EXCLUDED_TERMS_SECTION] ?? true}
          onOpenChange={(open) =>
            onSectionOpenChange(EXCLUDED_TERMS_SECTION, open)
          }
        >
          <Stack align="stretch" gap="6">
            <Stack align="stretch" gap="2">
              <Input
                label="Agrega términos que serán excluidos de la anonimización"
                placeholder="Ingresa un término"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
              />
              <Button variant="secondary" size="sm" onClick={handleAddWord}>
                Agregar término
              </Button>
            </Stack>
            {excludedWords.length > 0 && (
              <Stack p="1" bg="bg.secondary" rounded="xs" gap="1">
                {excludedWords.map((word) => (
                  <Label key={word} onRemove={() => handleRemoveWord(word)}>
                    {word}
                  </Label>
                ))}
              </Stack>
            )}
          </Stack>
        </LabelManagerSection>
      </Stack>
    </TooltipProvider>
  );
}
