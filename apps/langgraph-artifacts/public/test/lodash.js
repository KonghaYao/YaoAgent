import _ from "lodash";

const originalObject = {
    a: 1,
    b: {
        c: 2,
        d: [3, 4],
    },
};

// Shallow copy (modifying shallowCopy.b.d will affect originalObject.b.d)
const shallowCopy = { ...originalObject };
shallowCopy.b.d.push(5);
console.log("Original Object (after shallow copy modification):", originalObject); // Output: { a: 1, b: { c: 2, d: [ 3, 4, 5 ] } }

// Deep copy using _.cloneDeep()
const deepCopy = _.cloneDeep(originalObject);
deepCopy.b.d.push(6); // This modification will NOT affect originalObject
console.log("Original Object (after deep copy modification):", originalObject); // Output: { a: 1, b: { c: 2, d: [ 3, 4, 5 ] } }
console.log("Deep Copy:", deepCopy); // Output: { a: 1, b: { c: 2, d: [ 3, 4, 5, 6 ] } }
