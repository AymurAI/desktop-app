import { useEffect, useRef, useState } from "react";

import AnonymizerLabelSelect from "@/components/anonymizer/anonymizer-label-select";
import { useExcludedTagsConfig } from "@/store/useLocal";
import { css } from "@/styled/css";
import { styled } from "@/styled/jsx";
import type { SelectOption } from "@/types/select";
import { getActiveAnonymizerLabelOptions } from "@/utils/anonymizer/labels";
import { Button, Toolbar } from "@aymurai/ui";
import { SEARCH_MIN_LENGTH } from "../annotations";

const toolbarContainer = css({
  width: "full",
  minW: "0",
});

const labelControls = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "6",
  minW: "0",
  maxW: "full",
});

const labelSelect = css({
  flex: "[1 1 150px]",
  minW: "[150px]",
  maxW: "[320px]",
});

const managerButton = css({ whiteSpace: "nowrap" });

interface Props {
  isAnnotable?: boolean;
  isLabelManagerOpen: boolean;
  onSearchChange?: (value: string) => void;
  onLabelChange?: (object: SelectOption | undefined) => void;
  labelValue?: string;
  onLabelManagerToggle: () => void;
  matchesCount: number;
  activeIndex: number | null;
  onNext: () => void;
  onPrevious: () => void;
  onFocusDocument: () => void;
}

export const SearchBar = ({
  isAnnotable = false,
  isLabelManagerOpen,
  onSearchChange,
  onLabelChange,
  labelValue,
  onLabelManagerToggle,
  matchesCount,
  activeIndex,
  onNext,
  onPrevious,
  onFocusDocument,
}: Props) => {
  const [search, setSearch] = useState("");
  const { tags } = useExcludedTagsConfig();

  const toolbarRef = useRef<HTMLDivElement>(null);
  const labelOptions = getActiveAnonymizerLabelOptions(tags);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (toolbarRef.current?.contains(target)) return false;
      if (target.isContentEditable) return true;
      return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const input = toolbarRef.current?.querySelector("input");
      if (event.key === "Escape" && event.target === input) {
        event.preventDefault();
        setSearch("");
        onSearchChange?.("");
        onFocusDocument();
        return;
      }

      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "b";

      if (!isSearchShortcut || isEditableTarget(event.target)) return;

      event.preventDefault();
      input?.focus();
      input?.select();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onFocusDocument, onSearchChange]);

  const changeSearchHandler = (value: string) => {
    setSearch(value);
    onSearchChange?.(value);
  };

  const handleClear = () => {
    setSearch("");
    onSearchChange?.("");
  };

  const changeLabelSelectHandler = (e: SelectOption | undefined) => {
    onLabelChange?.(e);
  };

  return (
    <div
      ref={toolbarRef}
      className={toolbarContainer}
      data-testid="anon-toolbar"
    >
      <Toolbar
        context="anonimizador"
        searchValue={search}
        onSearchChange={changeSearchHandler}
        searchPlaceholder="Buscar"
        searchAriaLabel="Buscar en el documento"
        searchLabels={{
          clear: "Limpiar búsqueda",
          previous: "Coincidencia anterior",
          next: "Coincidencia siguiente",
        }}
        searchResultCount={
          search.length >= SEARCH_MIN_LENGTH
            ? matchesCount === 0
              ? "0 ocurrencias"
              : `${activeIndex === null ? 0 : activeIndex + 1} de ${matchesCount}`
            : undefined
        }
        onSearchClear={() => {
          handleClear();
          onFocusDocument();
        }}
        onSearchPrev={
          activeIndex !== null && activeIndex > 0 ? onPrevious : undefined
        }
        onSearchNext={
          activeIndex !== null && activeIndex < matchesCount - 1
            ? onNext
            : undefined
        }
        rightSlot={
          isAnnotable ? (
            <div className={labelControls}>
              <styled.p textStyle="label.md.strong" whiteSpace="pre-line">
                Aplicar&#10;etiquetas
              </styled.p>
              <div className={labelSelect}>
                <AnonymizerLabelSelect
                  placeholder="Etiqueta"
                  value={labelValue}
                  options={labelOptions}
                  onChange={changeLabelSelectHandler}
                />
              </div>
              {!isLabelManagerOpen && (
                <Button
                  variant="secondary"
                  onClick={onLabelManagerToggle}
                  className={managerButton}
                >
                  Gestor de etiquetas
                </Button>
              )}
            </div>
          ) : undefined
        }
      />
    </div>
  );
};
