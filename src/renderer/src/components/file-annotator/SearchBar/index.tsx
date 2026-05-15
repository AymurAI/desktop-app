import { type ChangeEvent, useRef, useState } from "react";

import Button from "@/components/ui/button";
import Select, { type SelectOption } from "@/components/ui/select";
import { useExcludedTagsConfig } from "@/store/useLocal";
import { sva } from "@/styled/css";
import { Grid, HStack, styled } from "@/styled/jsx";
import { hstack } from "@/styled/patterns";
import { getActiveAnonymizerLabelOptions } from "@/utils/anonymizer/labels";
import { MagnifyingGlass } from "phosphor-react";
import { Counter } from "./Counter";
import { useScroll } from "./useScroll";

const searchClasses = sva({
  slots: ["searchBar", "input", "verticalHr"],
  base: {
    searchBar: {
      ...hstack.raw({ alignItems: "center", gap: "2" }),
      height: "12",
      p: "3",
      rounded: "3xl",
      // minWidth: "[450px]",
      width: "full",
      border: "primary",
    },
    input: {
      outline: "none",
      width: "full",
    },
    verticalHr: {
      width: "[1px]",
      alignSelf: "stretch",
      borderWidth: "0",
      backgroundColor: "[#BCBAB8]",
      height: "12",
    },
  },
});

interface Props {
  isAnnotable?: boolean;
  isLabelManagerOpen: boolean;
  onSearchChange?: (value: string) => void;
  onLabelChange?: (object: SelectOption | undefined) => void;
  labelValue?: string;
  onLabelManagerToggle: () => void;
}

export const SearchBar = ({
  isAnnotable = false,
  isLabelManagerOpen,
  onSearchChange,
  onLabelChange,
  labelValue,
  onLabelManagerToggle,
}: Props) => {
  const [search, setSearch] = useState("");
  const { tags } = useExcludedTagsConfig();

  const inputSearchRef = useRef<HTMLInputElement>(null);

  const { next, previous, count, matchesCount } = useScroll(search);

  const classes = searchClasses();
  const labelOptions = getActiveAnonymizerLabelOptions(tags);

  const changeSearchHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearch(text);
    onSearchChange?.(e.target.value);
  };

  const clickSearchHandler = () => {
    if (inputSearchRef.current) {
      inputSearchRef.current.select();
    }
  };

  const handleClear = () => {
    setSearch("");
    onSearchChange?.("");
  };

  const searchFocus = () => inputSearchRef.current?.focus();

  const changeLabelSelectHandler = (e: SelectOption | undefined) => {
    onLabelChange?.(e);
  };

  return (
    <Grid
      gridTemplateColumns="minmax(0, 1fr) auto"
      px="8"
      py="6"
      gap="6"
      alignItems="center"
    >
      <div className={classes.searchBar} onClick={searchFocus}>
        <styled.span flexShrink="0" lineHeight="[0]">
          <MagnifyingGlass size={24} />
        </styled.span>
        <input
          type="text"
          placeholder="Buscar"
          value={search}
          className={classes.input}
          onChange={changeSearchHandler}
          onClick={clickSearchHandler}
        />
        <Counter
          clear={handleClear}
          next={next}
          previous={previous}
          count={matchesCount}
          cursor={count}
        />
      </div>
      {isAnnotable && (
        <HStack alignItems="center" gap="6">
          <hr className={classes.verticalHr} />
          <styled.p textStyle="label.md.strong" whiteSpace="pre-line">
            Aplicar&#10;etiquetas
          </styled.p>
          <div style={{ minWidth: 150 }}>
            <Select
              placeholder="Etiqueta"
              value={labelValue}
              options={labelOptions}
              onChange={changeLabelSelectHandler}
            />
          </div>
          {!isLabelManagerOpen && (
            <>
              <hr className={classes.verticalHr} />
              <Button
                variant="secondary"
                onClick={onLabelManagerToggle}
                style={{ whiteSpace: "nowrap" }}
              >
                Gestor de etiquetas
              </Button>
            </>
          )}
        </HStack>
      )}
    </Grid>
  );
};
