/**
 * Finds a row that looks like a table header based on keywords
 * @param {Object} sheet The Excel worksheet to search in
 * @param {Array} keywords List of keywords to look for in header cells
 * @returns {Object|null} Object with rowNumber and headerCells if found, null otherwise
 */
function findTableHeaderRow(sheet, keywords) {
  if (!sheet || !keywords || !keywords.length) return null;
  
  console.log(`Looking for header row with keywords: ${keywords.join(', ')}`);
  
  // Store the best match so far
  let bestMatch = null;
  let bestScore = 0;
  
  // Look through all rows in the sheet
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    
    // Skip empty rows
    if (!row.values || row.values.length <= 1) continue;
    
    // Count how many cells match specific expense table headers
    let exactMatchCount = 0;
    let partialMatchCount = 0;
    let headerCells = [];
    let rowText = [];
    
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // Only check string values
      if (cell.value && typeof cell.value === 'string') {
        const cellText = cell.value.toString().toLowerCase().trim();
        rowText.push(cellText);
        
        // Check if this cell exactly matches any of our keywords
        const exactMatch = keywords.some(keyword => 
          cellText === keyword.toLowerCase() || 
          cellText === keyword.toLowerCase() + 's' || // For plurals
          cellText === keyword.toLowerCase() + ':' // For labels
        );
        
        // Check for partial matches
        const partialMatch = !exactMatch && keywords.some(keyword => 
          cellText.includes(keyword.toLowerCase())
        );
        
        if (exactMatch) {
          exactMatchCount++;
          headerCells.push({
            column: colNumber,
            text: cellText,
            original: cell.value,
            exactMatch: true
          });
        } else if (partialMatch) {
          partialMatchCount++;
          headerCells.push({
            column: colNumber,
            text: cellText,
            original: cell.value,
            exactMatch: false
          });
        }
      }
    });
    
    // For debugging
    console.log(`Row ${rowNumber} text: ${rowText.join(', ')}`);
    
    // Calculate a score for this row
    // We want:
    // 1. Exact keyword matches 
    // 2. Multiple different keyword matches (not the same keyword repeated)
    // 3. Row has 3+ cells (likely a header row, not title)
    // 4. Row appears in the first 10 rows of the sheet
    
    // Get unique keywords that matched
    const uniqueKeywordsMatched = new Set();
    headerCells.forEach(cell => {
      keywords.forEach(keyword => {
        if (cell.text.includes(keyword.toLowerCase())) {
          uniqueKeywordsMatched.add(keyword);
        }
      });
    });
    
    // Calculate score
    const uniqueMatchBonus = uniqueKeywordsMatched.size * 3;
    const exactMatchScore = exactMatchCount * 2;
    const partialMatchScore = partialMatchCount;
    const cellCountBonus = rowText.length >= 3 ? 2 : 0;
    const rowPositionBonus = rowNumber > 1 && rowNumber <= 10 ? 3 : 0; // Prefer rows 2-10
    
    const totalScore = exactMatchScore + partialMatchScore + uniqueMatchBonus + cellCountBonus + rowPositionBonus;
    
    console.log(`Row ${rowNumber} score: ${totalScore} (exact: ${exactMatchCount}, partial: ${partialMatchCount}, unique: ${uniqueKeywordsMatched.size}, cells: ${rowText.length})`);
    
    // If this row has a better score than previous ones, remember it
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = { rowNumber, headerCells, score: totalScore };
    }
  }
  
  // Require a minimum score to consider it a valid header row
  if (bestMatch && bestMatch.score >= 5) {
    console.log(`Selected row ${bestMatch.rowNumber} as best header row match with score ${bestMatch.score}`);
    return bestMatch;
  }
  
  console.log('No suitable header row found matching the keywords');
  return null;
}

/**
 * Maps table columns in a header row to expense/mileage data fields
 * @param {Object} sheet The Excel worksheet
 * @param {Number} headerRowNumber The row number containing headers
 * @param {Object} fieldMappings Object mapping data fields to possible header text values
 * @returns {Object} Mapping of data fields to column letters or numbers
 */
function mapTableColumns(sheet, headerRowNumber, fieldMappings) {
  if (!sheet || !headerRowNumber || !fieldMappings) {
    console.log('Missing parameters for mapTableColumns');
    return {};
  }
  
  const row = sheet.getRow(headerRowNumber);
  if (!row) {
    console.log(`Row ${headerRowNumber} not found`);
    return {};
  }
  
  const columnMapping = {};
  
  // Process each cell in the header row
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (!cell.value) return;
    
    const cellText = cell.value.toString().toLowerCase().trim();
    
    // Check this cell against each field mapping
    Object.entries(fieldMappings).forEach(([field, possibleHeaders]) => {
      // Skip if we already found a mapping for this field
      if (columnMapping[field]) return;
      
      // Check if the cell text matches any of the possible headers
      const matches = possibleHeaders.some(header => 
        cellText.includes(header.toLowerCase())
      );
      
      if (matches) {
        // Get the column reference (letter or number)
        columnMapping[field] = getColumnLetter(colNumber);
        console.log(`Mapped field "${field}" to column ${columnMapping[field]} (${cellText})`);
      }
    });
  });
  
  return columnMapping;
}

/**
 * Converts a 1-based column number to an Excel column letter (A, B, C, ..., AA, AB, etc.)
 * @param {Number} colNumber The 1-based column number
 * @returns {String} The Excel column letter
 */
function getColumnLetter(colNumber) {
  let temp, letter = '';
  
  while (colNumber > 0) {
    temp = (colNumber - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colNumber = (colNumber - temp - 1) / 26;
  }
  
  return letter;
}

/**
 * Converts an Excel column letter to a 1-based column number
 * @param {String} colLetter The Excel column letter (A, B, C, ..., AA, AB, etc.)
 * @returns {Number} The 1-based column number
 */
function getColumnIndex(colLetter) {
  if (!colLetter || typeof colLetter !== 'string') {
    return 1; // Default to first column if invalid
  }
  
  // Handle if we're given a number already
  if (!isNaN(colLetter)) {
    return parseInt(colLetter);
  }
  
  // Convert column letter to number (A=1, B=2, ..., Z=26, AA=27, etc.)
  colLetter = colLetter.toUpperCase();
  let sum = 0;
  
  for (let i = 0; i < colLetter.length; i++) {
    sum = sum * 26 + (colLetter.charCodeAt(i) - 64);
  }
  
  return sum;
}

module.exports = {
  findTableHeaderRow,
  mapTableColumns,
  getColumnLetter,
  getColumnIndex
};