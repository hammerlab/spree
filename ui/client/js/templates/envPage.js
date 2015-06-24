
var columns = [
  { id: '0', label: 'Name', cmpFn: sortBy("0") },
  { id: '1', label: 'Name', cmpFn: sortBy("1") }
];

makeTable(
      columns, 'environmentPage', 'sort', 'columns', 'envRow', 'env', identity, ['0', 1]
);

