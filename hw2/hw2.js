const fs = require('node:fs');
const path = require('node:path');

function main() {
    const filePath = path.join('inputRecords.txt');
    const outputFilePath = path.join('outputRecords.txt'); // Define the path for the output file
    
    let fileData = readFile(filePath);

    if (fileData) {
        let records = getRecords(fileData);

        // Check if records processing returned null (indicating an error)
        if (!records) {
            console.log("Invalid formatting, missing BEGIN or END RECORD");
            return; // Stop the program
        }

        let recordsWithProperties = records.map(getProperties);

        // Validate all records; if any are invalid, stop the program
        for (let i = 0; i < recordsWithProperties.length; i++) {
            if (!validateRecord(recordsWithProperties[i])) {
                console.log("Invalid text input of records, please check your properties");
                return; // Stop the program
            }
        }

        // If all records are valid, sort them
        let sortedRecords = sortRecords(recordsWithProperties);

        // Write the sorted records to a new file
        createFile(sortedRecords, outputFilePath);
    }
}


//function will read the txt file
function readFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8'); //we are reading fille as a string
        return data
    } catch (err) {
        console.error(err);
        return null;
    }
}

// function will split the file content into individual records
function getRecords(fileData) {
    const lines = fileData.split(/\r?\n/); 
    const records = [];
    let currentRecord = [];
    let isRecordOpen = false;  // Flag to check if a record is open

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.toUpperCase() === 'BEGIN:RECORD') {
            if (isRecordOpen) {
                console.log("Error: Nested BEGIN:RECORD found.");
                return null;  // Invalid record structure
            }
            isRecordOpen = true;
            currentRecord = [trimmedLine];
        } else if (trimmedLine.toUpperCase() === 'END:RECORD') {
            if (!isRecordOpen) {
                console.log("Error: END:RECORD without matching BEGIN:RECORD.");
                return null;  // Invalid record structure
            }
            isRecordOpen = false;
            currentRecord.push(trimmedLine);
            records.push(currentRecord.join('\n'));
            currentRecord = [];
        } else if (trimmedLine) {
            if (!isRecordOpen) {
                console.log("Error: Data outside of BEGIN:RECORD and END:RECORD.");
                return null;  // Data outside of a record
            }
            currentRecord.push(trimmedLine);
        }
    }

    if (isRecordOpen) {
        console.log("Error: File ends with an open record (missing END:RECORD).");
        return null;  // File ends while still inside a record
    }

    return records;
}

// Extract all the properties from a record
function getProperties(recordString) {
    const lines = recordString.split('\n');
    const properties = {};
    let isValidRecord = true; // Flag to check if the record has valid BEGIN and END

    lines.forEach(line => {
        if (!line.trim()) return; // Skip empty lines

        // Only process lines within BEGIN:RECORD and END:RECORD
        const normalizedLine = line.toUpperCase().trim();
        if (normalizedLine === 'BEGIN:RECORD' || normalizedLine === 'END:RECORD') {
            return; // Skip these lines, as they are not properties
        }

        // Split the line by the colon to separate the key and the value
        let [key, value] = line.split(':');
        if (key && value) {
            key = key.trim().toUpperCase(); // Normalize the key
            value = value.trim();

            properties[key] = value; // Add the property to the properties object
        } else {
            isValidRecord = false; // If any line is not a key-value pair, the record is invalid
        }
    });

    // If the record is invalid, return null to indicate an error
    return isValidRecord ? properties : null;
}

// Helper function to check if a value is numeric
function isNumeric(value) {
    return /^-?\d+(\.\d+)?$/.test(value);
}
// Check if the records and properties are valid
function validateRecord(recordProperties) {
    if (!recordProperties) return false; // If getProperties returned null, the record is invalid

    const mandatoryProperties = ['IDENTIFIER', 'TIME'];
    const optionalProperties = ['WEIGHT', 'COLOR', 'UNITS'];
    const validProperties = [...mandatoryProperties, ...optionalProperties];
    const validUnits = ["kg", "lb", "kilograms", "pounds"];
    const hexColorPattern = /^#[0-9A-F]{6}$/i;

    // Check for unrecognized properties
    for (const key of Object.keys(recordProperties)) {
        if (!validProperties.includes(key)) {
            console.log(`Unrecognized property: ${key}`);
            return false;
        }
    }

    // Check for missing mandatory properties or properties without values
    for (const key of mandatoryProperties) {
        if (!recordProperties[key]) {
            console.log(`Missing mandatory property`);
            return false;
        } else if (recordProperties[key].trim() === '') {
            console.log(`Property is missing a value!`);
            return false;
        }
    }

    // Validate TIME format and value
    if (!isValidTime(recordProperties['TIME'])) {
        console.log('Invalid TIME property');
        return false;
    }

    // If 'WEIGHT' is present, check for valid value and if 'UNITS' must also be present and valid
    if (recordProperties['WEIGHT']) {
        if (!isNumeric(recordProperties['WEIGHT'])) {
            console.log('Invalid WEIGHT property, nust be a proper number');
            return false;
        }
        if (recordProperties['WEIGHT'].trim() === '') {
            console.log('Weight property is invalid or missing a value!');
            return false;
        }
        if (!recordProperties['UNITS']) {
            console.log('Missing UNITS property for WEIGHT');
            return false;
        }
        if (!validUnits.includes(recordProperties['UNITS'].toLowerCase())) {
            console.log('Invalid UNITS property');
            return false;
        }
    }
    // if units is present without weight
    if (recordProperties['UNITS']) {
        if (!recordProperties['WEIGHT']) {
            console.log('Missing WEIGHT property for UNITS');
            return false;
        }
    }

    // If 'COLOR' is present, it must be a valid hex color code
    if (recordProperties['COLOR']) {
        if (recordProperties['COLOR'].trim() === '') {
            console.log('Color property is missing a value!');
            return false;
        } else if (!hexColorPattern.test(recordProperties['COLOR'])) {
            console.log('Invalid COLOR property');
            return false;
        }
    }

    // Check for optional properties that should not be duplicated
    for (const key of optionalProperties) {
        if (recordProperties[key] && Array.isArray(recordProperties[key])) {
            console.log('There are duplicate properties');
            return false;
        }
    }

    // All checks passed
    return true;
}

// function to parse and validate time
function isValidTime(input) {
    if (input[8] !== "T" || input.length !== 15) {
        return false;
    }
    const components = {
        year: parseInt(input.substring(0, 4), 10),
        month: parseInt(input.substring(4, 6), 10) - 1,
        day: parseInt(input.substring(6, 8), 10),
        hour: parseInt(input.substring(9, 11), 10),
        minute: parseInt(input.substring(11, 13), 10),
        second: parseInt(input.substring(13, 15), 10)
    };
    // Validate each component
    if (
        isNaN(components.year) || components.year < 0 || components.year > 9999 ||
        isNaN(components.month) || components.month < 0 || components.month > 11 ||
        isNaN(components.day) || components.day < 1 || components.day > getDaysInMonth(components.year, components.month) ||
        isNaN(components.hour) || components.hour < 0 || components.hour > 23 ||
        isNaN(components.minute) || components.minute < 0 || components.minute > 59 ||
        isNaN(components.second) || components.second < 0 || components.second > 59 ||
        Object.values(components).some(val => isNaN(val) || val.toString().includes(' '))
    ) {
        return false;
    }

    return true;
}
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}


// sort the records by the time property
function sortRecords(recordsWithProperties) {
    // Define a helper function to parse the TIME string into a Date object
    function parseTheTime(timeString) {
        const year = parseInt(timeString.substring(0, 4), 10);
        const month = parseInt(timeString.substring(4, 6), 10) - 1; // Subtract 1 because JS months are 0-indexed
        const day = parseInt(timeString.substring(6, 8), 10);
        const hour = parseInt(timeString.substring(9, 11), 10);
        const minute = parseInt(timeString.substring(11, 13), 10);
        const second = parseInt(timeString.substring(13), 10);

        return new Date(year, month, day, hour, minute, second);
    }

    // Sort records based on the TIME property
    return recordsWithProperties.sort((a, b) => {
        const timeA = parseTheTime(a['TIME']);
        const timeB = parseTheTime(b['TIME']);
        return timeA - timeB;
    });
}

// write the sorted records to a new file
function createFile(sortedRecords, outputPath) {
    // Combine the records into a single string, including the BEGIN:RECORD and END:RECORD markers
    const outputData = sortedRecords.map(recordProperties => {
        // Start with BEGIN:RECORD
        let recordString = "BEGIN:RECORD\n";
        // Add each property to the record
        recordString += Object.entries(recordProperties).map(([key, value]) => `${key}: ${value}`).join('\n');
        // End with END:RECORD
        recordString += "\nEND:RECORD";
        return recordString;
    }).join('\n\n');

    // Write the string to the output file
    try {
        fs.writeFileSync(outputPath, outputData, 'utf8');
        console.log(`Records have been sorted by time and written to ${outputPath}`);
    } catch (err) {
        console.error(`Error writing to ${outputPath}: ${err}`);
    }
}

// Only run main if file is run directly from terminal, not when imported by another framework like Jasmine
if (require.main === module) {
    main();
} else {
    module.exports = { getRecords, getProperties, validateRecord, sortRecords, createFile, isValidTime };
}