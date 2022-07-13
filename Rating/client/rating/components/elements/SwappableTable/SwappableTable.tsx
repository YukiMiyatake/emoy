import React, {
    ComponentPropsWithoutRef,
    DragEventHandler,
    forwardRef,
    useEffect,
    useMemo,
} from "react";

import throttle from "lodash.throttle";
import { classnames } from "tailwindcss-classnames";

import { useDnD } from "./useDnD";
import { useOrderedCells } from "./useOrderdCells";


export type Props = Readonly<
  {
    columns: { id: string; value: string }[];
    rows: string[][];
  } & Omit<ComponentPropsWithoutRef<"table">, "className">
>;

export const SwappableTable = forwardRef<HTMLTableElement, Props>(
    (props, ref) => {
        const { columns, rows, ...rest } = props;
    
        const [ordered, changeOrder] = useOrderedCells(columns, rows);
    
        const [dndState, { dragStart, dragEnter, dragLeave, drop, dragEnd }] =
          useDnD();
    
        const dragOver = useMemo(() => {
          return throttle<DragEventHandler<HTMLDivElement>>((e) => {
            if (!(e.target instanceof HTMLDivElement)) {
              return;
            }
            const { id } = e.target.dataset;
    
            if (id) {
              //changeOrder(dndState.draggedId, dndState.hoveredId);
              dragEnter(id);
            }
          }, 300);
        }, [dragEnter]);
    
        const handleDragEnd: DragEventHandler<HTMLDivElement> = () => {
          changeOrder(dndState.draggedId, dndState.hoveredId);
          dragEnd();
        };
    
        useEffect(() => {
          return () => {
            dragOver.cancel();
          };
        }, [dragOver]);
    
        return (
          <table ref={ref} {...rest}>
            <thead>
              <tr>
                {ordered.columns.map(({ id, value }) => (
                  <td
                    key={id}
                    className={classnames(
                      "border",
                      "border-gray-400",
                      "bg-gray-200"
                    )}
                  >
                    <div
                      draggable
                      onDragStart={() => dragStart(id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        dragOver(e);
                      }}
                      onDragLeave={() => dragLeave()}
                      onDrop={() => drop(id)}
                      onDragEnd={handleDragEnd}
                      className={classnames("p-2", {
                        ["bg-blue-200"]: dndState.draggedId === id,
                        ["bg-red-200"]: dndState.hoveredId === id,
                      })}
                      data-id={id}
                    >
                      {value}
                    </div>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordered.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((item, j) => (
                    <td
                      key={j}
                      className={classnames("border", "border-gray-400", "p-2")}
                    >
                      {item}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
);
SwappableTable.displayName = "SwappableTable";
