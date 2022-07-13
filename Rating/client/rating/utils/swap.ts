export const swap = <T>(array: T[], fromIndex: number, toIndex: number) => {
    if (fromIndex >= array.length || toIndex >= array.length) {
      throw new RangeError("fromIndex/toIndex must be less than array.length");
    }
  
    if (fromIndex < 0 || toIndex < 0) {
      throw new RangeError("fromIndex/toIndex must be greater than 0");
    }
  
    [array[fromIndex], array[toIndex]] = [array[toIndex], array[fromIndex]];
  
    return array;
  };
  