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

// 表示中身コンポーネント作成しなきゃ
// 5vs5だけど汎用的にしたい
export type Props = Readonly<
  {
    //blue: { id: string; value: string }[];
    //red: { id: string; value: string }[];
    columns: { id: string; value: string }[];
    //rows: string[][];
  } & Omit<ComponentPropsWithoutRef<"div">, "className">
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
      <div className="container">
        <div className="row"><div className="col text-primary">Blue</div>
          <div className="col text-danger">Red</div></div>

        {
          [...Array(5)].map((_, i) => (

            <div className="row" key={i + 100}>

              <div className="col border border-primary"
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
                data-id={columns[i].id}
              >
                {columns[i].value}
              </div>


              <div className="col border border-danger"
                key={columns[i + 5].id}
                draggable
                onDragStart={() => dragStart(columns[i + 5].id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  dragOver(e);
                }}
                onDragLeave={() => dragLeave()}
                onDrop={() => drop(columns[i + 5].id)}
                onDragEnd={handleDragEnd}
                data-id={columns[i + 5].id}
              >
                {columns[i + 5].value}
              </div>

            </div>
          ))
        }

      </div>

    );
  }
);
SwappableTable.displayName = "SwappableTable";
