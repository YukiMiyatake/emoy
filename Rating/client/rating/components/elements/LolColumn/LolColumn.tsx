import React, {
  ComponentPropsWithoutRef,
  DragEventHandler,
  forwardRef,
  useEffect,
  useMemo,
} from "react";

const LaneName: string[] = ["Top", "Jg", "Mid", "Bot", "Sup"];

export type Props = Readonly<
  {
    index: number;
  } & Omit<ComponentPropsWithoutRef<"p">, "className">
>;

export const LolColumn = (props: Props) => {
  return (
    <>
      <p className="container">{LaneName[props.index]}</p>
      <select name="month">
        <option value="jan">1月</option>
        <option value="feb">2月</option>
        <option value="mar">3月</option>
        <option value="apr">4月</option>
        <option value="may">5月</option>
        <option value="jun">6月</option>
        <option value="jul">7月</option>
        <option value="aug">8月</option>
        <option value="sep">9月</option>
        <option value="oct">10月</option>
        <option value="nov">11月</option>
        <option value="dec">12月</option>
      </select>
    </>
  );
};
LolColumn.displayName = "LolColumn";
