export const exportToCSV = (data: any[], filename: string, columns: { header: string; accessorKey: string | ((row: any) => any) }[]) => {
  if (!data || !data.length) return;

  const csvRows = [];
  
  // Headers
  const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`);
  csvRows.push(headers.join(','));

  // Rows
  for (const row of data) {
    const values = columns.map(col => {
      let val: any;
      if (typeof col.accessorKey === 'function') {
        val = col.accessorKey(row);
      } else {
        // Handle nested paths like 'customer.name'
        val = col.accessorKey.split('.').reduce((acc, part) => acc && acc[part], row);
      }
      
      if (val === null || val === undefined) val = '';
      
      const valStr = String(val).replace(/"/g, '""');
      return `"${valStr}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('url');
  if ((navigator as any).msSaveBlob) {
    // IE 10+
    (navigator as any).msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
