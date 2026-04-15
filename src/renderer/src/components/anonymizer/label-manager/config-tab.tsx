import { useState } from "react";
import { HStack, Stack, styled } from "@/styled/jsx";
import { anonymizerLabels } from "@/types/aymurai";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import BaseSwitch from "@/components/ui/switch";
import { XCircle } from "phosphor-react";
import LabelManagerSection from "./section";

interface ToggleProps {
  name: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}
function Switch({ name, value, onToggle }: ToggleProps) {
  return (
    <styled.div px="4" py="3" bg="bg.secondary" rounded="xs">
      <HStack justify="space-between">
        <styled.span textStyle="label.md.default">{name}</styled.span>
        <BaseSwitch checked={value} onCheckedChange={onToggle} />
      </HStack>
    </styled.div>
  );
}

interface ExcludedWordProps {
  value: string;
  onRemove: () => void;
}
function ExcludedWord({ value, onRemove }: ExcludedWordProps) {
  return (
    <HStack
      justify="space-between"
      px="2"
      py="1"
      bg="bg.primary-alternative"
      rounded="xs"
    >
      <styled.span textStyle="label.md.default">{value}</styled.span>
      <styled.button type="button" onClick={onRemove} cursor="pointer">
        <XCircle size={16} />
      </styled.button>
    </HStack>
  );
}

const initialToggles = Object.fromEntries(
  anonymizerLabels.map((label) => [label.id, true])
);

export default function LabelConfigTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(initialToggles);
  const [excludedWords, setExcludedWords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  function handleToggle(id: string, value: boolean) {
    setToggles((prev) => ({ ...prev, [id]: value }));
  }

  function handleAddWord() {
    const trimmed = inputValue.trim();
    if (!trimmed || excludedWords.includes(trimmed)) return;
    setExcludedWords((prev) => [...prev, trimmed]);
    setInputValue("");
  }

  function handleRemoveWord(word: string) {
    setExcludedWords((prev) => prev.filter((w) => w !== word));
  }

  return (
    <Stack gap="6" align="stretch">
      <LabelManagerSection title="Categorias incluidas">
        <Stack>
          {anonymizerLabels.map((label) => (
            <Switch
              key={label.id}
              name={label.text}
              value={toggles[label.id]}
              onToggle={(value) => handleToggle(label.id, value)}
            />
          ))}
        </Stack>
      </LabelManagerSection>
      <styled.hr borderColor="[#BCBAB8]" />
      <LabelManagerSection title="Términos excluidos">
        <Stack align="stretch" gap="6">
          <Stack align="stretch" gap="2">
            <Input
              label="Terminos excluidos"
              placeholder="Ingresa un termino"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
            />
            <Button variant="secondary" size="sm" onClick={handleAddWord}>
              Agregar termino
            </Button>
          </Stack>
          {excludedWords.length > 0 && (
            <Stack p="1" bg="bg.secondary" rounded="xs" gap="1">
              {excludedWords.map((word) => (
                <ExcludedWord
                  key={word}
                  value={word}
                  onRemove={() => handleRemoveWord(word)}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </LabelManagerSection>
    </Stack>
  );
}
