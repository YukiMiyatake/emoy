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
        blue: { id: string; value: string }[];
        red: { id: string; value: string }[];
        //rows: string[][];
    } & Omit<ComponentPropsWithoutRef<"div">, "className">
>;

export const SwappableTable = forwardRef<HTMLTableElement, Props>(
    (props, ref) => {
        //const { columns, ...rest } = props;
    
        const [ordered, changeOrder] = useOrderedCells(props);
        //const [state, setState] = useState([getItems(10), getItems(5, 10)]);

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
    
        const blue = ordered.blue;
        const red = ordered.columns.slice(5,10);

        return (
          <table className="container">
              <tr>
              <td className="col"> 

                <table>
                {

                blue.map(({ id, value }) => (
                    


                    <tr 
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
                      className="row"
                      data-id={id}
                    >
                      {value}
                    </tr>



                    

                ))
                
                }
                </table>
                </td>


                <td className="col"> 
                <table>
                {

                red.map(({ id, value }) => (
                    


                    <tr
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
                    className="row"
                    data-id={id}
                    >
                    {value}
                    </tr>



                    

                ))

                }
                </table>
                </td>
                

                </tr>

            </table>

        );
      }
);
SwappableTable.displayName = "SwappableTable";
