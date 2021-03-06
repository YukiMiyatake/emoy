import { useCallback, useState } from "react";

import { Props } from ".";
import { swap } from "../../../utils/swap";

export const useOrderedCells = (
  columns: Props["columns"]
) => {

  //const blue = columns["blue"];
  //const red = columns["red"];
  
  //const [orderedColumns, setOrderedColumns] = useState([blue,red]);
  const [orderedColumns, setOrderedColumns] = useState(columns);

  const find = (target: string) => {
    columns.findIndex(({ id }) => id === target);
  }

  const changeOrder = useCallback(
    (fromId: string | undefined, toId: string | undefined) => {
      if (fromId === undefined || toId === undefined || fromId === toId) {
        return;
      }
      const fromIndex = columns.findIndex(({ id }) => id === fromId);
      const toIndex = columns.findIndex(({ id }) => id === toId);

      const resultColumns = swap(columns, fromIndex, toIndex);

      // rows の中の配列を desiredSort の順に並び替える
    //  const resultRows = rows.map((row) => swap(row, fromIndex, toIndex));

      setOrderedColumns(resultColumns);
   //   setOrderedRows(resultRows);
    },
    [columns]
  );

  return [{ columns: orderedColumns }, changeOrder] as const;
};