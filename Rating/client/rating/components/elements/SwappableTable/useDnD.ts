import { useCallback, useReducer } from "react";

export type DnDState = {
  draggedId: string | undefined;
  hoveredId: string | undefined;
  droppedId: string | undefined;
};

const initialState: DnDState = {
  draggedId: undefined,
  hoveredId: undefined,
  droppedId: undefined,
};

type Action =
  | { type: "dragStart"; id: string }
  | { type: "dragEnter"; id: string }
  | { type: "dragLeave" }
  | { type: "drop"; id: string }
  | { type: "dragEnd" };

const reducer = (state: DnDState, action: Action): DnDState => {
  switch (action.type) {
    case "dragStart": {
      return {
        ...state,
        draggedId: action.id,
      };
    }
    case "dragEnter": {
      return {
        ...state,
        hoveredId: action.id,
      };
    }
    case "dragLeave": {
      return {
        ...state,
        hoveredId: undefined,
      };
    }
    case "drop": {
      return {
        ...state,
        droppedId: action.id,
      };
    }
    case "dragEnd": {
      return { ...initialState };
    }
  }
};

export const useDnD = (state = initialState) => {
  const [dndState, dispatch] = useReducer(reducer, state);

  const dragStart = useCallback((id: string) => {
    dispatch({ type: "dragStart", id });
  }, []);

  const dragEnter = useCallback((id: string) => {
    dispatch({ type: "dragEnter", id });
  }, []);

  const dragLeave = useCallback(() => {
    dispatch({ type: "dragLeave" });
  }, []);

  const drop = useCallback((id: string) => {
    dispatch({ type: "drop", id });
  }, []);

  const dragEnd = useCallback(() => {
    dispatch({ type: "dragEnd" });
  }, []);

  return [
    dndState,
    { dragStart, dragEnter, dragLeave, drop, dragEnd },
  ] as const;
};