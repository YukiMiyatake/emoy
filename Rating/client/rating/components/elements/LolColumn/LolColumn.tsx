import React, {
  ComponentPropsWithoutRef,
  DragEventHandler,
  forwardRef,
  useEffect,
  useMemo,
} from "react";
import Select from "react-select";

const LaneName: string[] = ["Top", "Jg", "Mid", "Bot", "Sup"];

export type Props = Readonly<
  {
    index: number;
  } & Omit<ComponentPropsWithoutRef<"p">, "className">
>;

const aquaticCreatures = [
  { label: "Shark", value: "Shark" },
  { label: "Dolphin", value: "Dolphin" },
  { label: "Whale", value: "Whale" },
  { label: "Octopus", value: "Octopus" },
  { label: "Crab", value: "Crab" },
  { label: "Lobster", value: "Lobster" },
];

export const LolColumn = (props: Props) => {
  return (
    <>
      <p className="container">{LaneName[props.index]}</p>
      <Select options={aquaticCreatures} />
    </>
  );
};
LolColumn.displayName = "LolColumn";
