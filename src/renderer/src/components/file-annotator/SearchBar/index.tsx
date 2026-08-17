import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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

// G3 (tasks/responsive-fixes/issues/G3-toolbar-y-cierre-panel.md), issue 05:
// this group used to be `Toolbar`'s `rightSlot`, which the library wraps in
// two nested divs before rendering it - the OUTER one carries exactly the
// two props this recipe is missing (`ml: "auto"`, `flexShrink: "0"`;
// `minW`/`maxW` were already here) and, for this component's context
// ("anonimizador"), ALWAYS renders a 1px divider (`Wd`, dist/index.js) as
// the first child of that wrapper - unconditionally, not just when the row
// wraps. Passing this group as `Toolbar`'s `children` instead (documented as
// "fully custom layouts") skips that whole branch, so the divider is gone at
// every width rather than only hidden when it happens not to orphan - a
// media query keyed on width couldn't do this correctly anyway, since the
// wrap point depends on the entities panel's open/closed state, not just
// viewport width. No `@aymurai/ui` style is being overridden here - this is
// a straight prop swap - so there is deliberately no cascade trick (no
// `"&&"`, no child-selector) protecting anything: G2 established the
// specificity workaround for when one is genuinely needed, and adding one
// here for a problem that doesn't exist would be a decoration nobody
// verifies.
//
// G10 (tasks/responsive-fixes/issues/G10-toolbar-wrap-1024.md): `ml: "auto"`
// was removed because it was INERT whenever this group shared a row with the
// search bar - the search wrapper is `flex: "1"`, so it already absorbs all
// the free space and pushes this group to the right on its own (computed
// `margin-left` measured at `0px` in every same-row case). The margin only
// did anything once the group wrapped ALONE onto a second row, and that is
// exactly where it went wrong: it then pulled the group to the far right of
// that empty row (265.156px at 1024 with the panel open, 158.938px at 768
// with the panel closed) instead of letting it start under the search bar
// like a normal wrapped line. Do not restore it to "fix" right-alignment -
// the right-alignment on shared rows was never coming from this margin.
const labelControls = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  flexWrap: "wrap",
  gap: "6",
  minW: "0",
  maxW: "full",
  flexShrink: "0",
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
  const { t } = useTranslation("anonymizer");
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
    <div ref={toolbarRef} className={toolbarContainer}>
      <Toolbar
        context="anonimizador"
        searchValue={search}
        onSearchChange={changeSearchHandler}
        searchPlaceholder={t("searchBar.searchPlaceholder")}
        searchAriaLabel={t("searchBar.searchAriaLabel")}
        searchLabels={{
          clear: t("searchBar.clearSearch"),
          previous: t("searchBar.previousMatch"),
          next: t("searchBar.nextMatch"),
        }}
        searchResultCount={
          search.length >= SEARCH_MIN_LENGTH
            ? matchesCount === 0
              ? t("searchBar.noMatches")
              : t("searchBar.matchCount", {
                  current: activeIndex === null ? 0 : activeIndex + 1,
                  total: matchesCount,
                })
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
      >
        {isAnnotable && (
          <div className={labelControls}>
            <styled.p textStyle="label.md.strong" whiteSpace="nowrap">
              {t("searchBar.applyLabels")}
            </styled.p>
            <div className={labelSelect}>
              <AnonymizerLabelSelect
                placeholder={t("searchBar.labelPlaceholder")}
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
                {t("searchBar.manageLabels")}
              </Button>
            )}
          </div>
        )}
      </Toolbar>
    </div>
  );
};
