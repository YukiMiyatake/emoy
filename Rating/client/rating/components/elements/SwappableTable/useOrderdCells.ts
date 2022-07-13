import { useCallback, useState } from "react";

import { Props } from ".";
import { swap } from "../../../utils/swap";

export const useOrderedCells = (
  columns: Props["columns"],
  rows: Props["rows"]
) => {
  const [orderedColumns, setOrderedColumns] = useState(columns);
  const [orderedRows, setOrderedRows] = useState(rows);

  const changeOrder = useCallback(
    (fromId: string | undefined, toId: string | undefined) => {
      if (fromId === undefined || toId === undefined || fromId === toId) {
        return;
      }
      const fromIndex = columns.findIndex(({ id }) => id === fromId);
      const toIndex = columns.findIndex(({ id }) => id === toId);

      // columns を desiredSort の順に並び替える
      const resultColumns = swap(columns, fromIndex, toIndex);

      // rows の中の配列を desiredSort の順に並び替える
      const resultRows = rows.map((row) => swap(row, fromIndex, toIndex));

      setOrderedColumns(resultColumns);
      setOrderedRows(resultRows);
    },
    [columns, rows]
  );

  return [{ columns: orderedColumns, rows: orderedRows }, changeOrder] as const;
};