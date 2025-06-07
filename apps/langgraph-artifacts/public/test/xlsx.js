import XLSX from "xlsx";

// --- Simulate an incoming Excel file buffer ---
// In a real application, this buffer would come from a file upload,
// a network stream, or some other in-memory source.
// For this demo, we'll create a simple workbook and convert it to a buffer.

// Create a dummy workbook in memory
const dummyData = [
    { Name: "Alice", Age: 30, City: "New York" },
    { Name: "Bob", Age: 24, City: "London" },
];
const dummyWorkbook = XLSX.utils.book_new();
const dummyWorksheet = XLSX.utils.json_to_sheet(dummyData);
XLSX.utils.book_append_sheet(dummyWorkbook, dummyWorksheet, "PeopleData");

// Convert the dummy workbook to a Buffer (this is what you'd typically receive)
const excelBuffer = XLSX.write(dummyWorkbook, { type: "buffer", bookType: "xlsx" });

console.log("--- Reading Excel from Buffer ---");

try {
    // Read the workbook directly from the buffer
    const workbook = XLSX.read(excelBuffer, { type: "buffer" });

    // Get the name of the first sheet
    const sheetName = workbook.SheetNames[0];

    // Get the worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON (array of objects)
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log("Data read from Excel (from buffer):");
    console.log(jsonData);
} catch (error) {
    console.error(`Error reading Excel from buffer: ${error.message}`);
}
