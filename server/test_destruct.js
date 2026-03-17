const rows = [{ pCount: 17 }];
const fields = {};
const result = [rows, fields];

const [[{ pCount }]] = result;
console.log('pCount:', pCount);
