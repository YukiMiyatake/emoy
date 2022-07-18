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
        //blue: { id: string; value: string }[];
        //red: { id: string; value: string }[];
        columns: { id: string; value: string }[];
        //rows: string[][];
    } & Omit<ComponentPropsWithoutRef<"table">, "className">
>;

export const SwappableTable = forwardRef<HTMLTableElement, Props>(
    (props, ref) => {
        const { columns, ...rest } = props;
    
        const [ordered, changeOrder] = useOrderedCells(columns);
        //const [state, setState] = useState([getItems(10), getItems(5, 10)]);

        const [dndState, { dragStart, dragEnter, dragLeave, drop, dragEnd }] =
            useDnD();
    
        const dragOver = useMemo(() => {
            return throttle<DragEventHandler<HTMLElement>>((e) => {
                if (!(e.target instanceof HTMLElement)) {
                    return;
                }
            const { id } = e.target.dataset;
    
                if (id) {
                    //changeOrder(dndState.draggedId, dndState.hoveredId);
                    dragEnter(id);
                }
            }, 300);
        }, [dragEnter]);
    
        const handleDragEnd: DragEventHandler<HTMLElement> = () => {
          changeOrder(dndState.draggedId, dndState.hoveredId);
          dragEnd();
        };
    
        useEffect(() => {
          return () => {
            dragOver.cancel();
          };
        }, [dragOver]);
    

        return (
          <table className="container">
            <thead><tr><th>Blue</th><th>Red</th></tr></thead>
            <tbody>
                {
                    [...Array(5)].map((_, i) => (

                        <tr key={i+100}>

                        <td 
                        key={columns[i].id}
                        draggable
                        onDragStart={() => dragStart(columns[i].id)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            dragOver(e);
                        }}
                        onDragLeave={() => dragLeave()}
                        onDrop={() => drop(columns[i].id)}
                        onDragEnd={handleDragEnd}
                        className="col"
                        data-id={columns[i].id}
                        >
                        {columns[i].value}
                        </td>


                        <td 
                        key={columns[i+5].id}
                        draggable
                        onDragStart={() => dragStart(columns[i+5].id)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            dragOver(e);
                        }}
                        onDragLeave={() => dragLeave()}
                        onDrop={() => drop(columns[i+5].id)}
                        onDragEnd={handleDragEnd}
                        className="col"
                        data-id={columns[i+5].id}
                        >
                        {columns[i+5].value}
                        </td>

                        </tr>
                    ))
                } 

              </tbody>
            </table>

        );
      }
);
SwappableTable.displayName = "SwappableTable";
