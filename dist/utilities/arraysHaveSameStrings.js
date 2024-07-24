export function arraysHaveSameStrings(arr1, arr2) {
    // Step 1: Check if arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }
    // Step 2: Sort both arrays
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();
    // Step 3: Compare each element
    for(let i = 0; i < sortedArr1.length; i++){
        if (sortedArr1[i] !== sortedArr2[i]) {
            return false;
        }
    }
    return true;
}

//# sourceMappingURL=arraysHaveSameStrings.js.map