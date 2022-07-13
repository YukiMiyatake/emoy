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
        //rows: string[][];
    } & Omit<ComponentPropsWithoutRef<"div">, "className">
>;

export const SwappableTable = forwardRef<HTMLTableElement, Props>(
    (props, ref) => {
        const { columns, ...rest } = props;
    
        const [ordered, changeOrder] = useOrderedCells(columns);
    
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
    
        const entries = ordered.columns.entries();

        return (
          <div className="container">
              <span className="col"> <span className="row">a</span><span className="row">b</span><span className="row">c</span> </span>
              <span className="col"> <span className="row">1</span><span className="row">2</span><span className="row">3</span> </span>

                {

                ordered.columns.map(({ id, value }) => (
                    <>


                    <span
                        key={id}
                        draggable
                        onDragStart={() => dragStart(id)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            dragOver(e);
                        }}
                      onDragLeave={() => dragLeave()}
                      onDrop={() => drop(id)}
                      onDragEnd={handleDragEnd}
                      className="col"
                      data-id={id}
                    >
                      {value}
                    </span>



                    </>

                ))
                
                }
                </div>

        );
      }
);
SwappableTable.displayName = "SwappableTable";
