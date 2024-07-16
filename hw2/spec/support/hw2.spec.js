const { getRecords, getProperties, validateRecord, sortRecords, createFile, isValidTime} = require('../../hw2');

describe("Record Processing", function() {

    describe("getRecords function", function() {
        it("should correctly split the file content into individual records", function() {
            const fileData = 
                "BEGIN:RECORD\nIDENTIFIER: 123\nTIME: 20240401T123000\nEND:RECORD\n" +
                "BEGIN:RECORD\nIDENTIFIER: 124\nTIME: 20240402T123000\nEND:RECORD";
            const result = getRecords(fileData);
            expect(result.length).toBe(2);
            expect(result[0]).toContain("IDENTIFIER: 123");
            expect(result[1]).toContain("IDENTIFIER: 124");
        });

        it("should return null if a BEGIN:RECORD is nested", function() {
            const fileData = 
                "BEGIN:RECORD\n" +
                "BEGIN:RECORD\nIDENTIFIER: 123\nTIME: 20240401T123000\nEND:RECORD\n";
            const result = getRecords(fileData);
            expect(result).toBeNull();
        });

        it("should return null if END:RECORD is encountered without a matching BEGIN:RECORD", function() {
            const fileData = "END:RECORD\nIDENTIFIER: 123\nTIME: 20240401T123000\nEND:RECORD";
            const result = getRecords(fileData);
            expect(result).toBeNull();
        });

        it("should return null if data is encountered outside of BEGIN:RECORD and END:RECORD", function() {
            const fileData = 
                "IDENTIFIER: 123\nTIME: 20240401T123000\n" +
                "BEGIN:RECORD\nIDENTIFIER: 124\nTIME: 20240402T123000\nEND:RECORD";
            const result = getRecords(fileData);
            expect(result).toBeNull();
        });

        it("should return null if file ends with an open record (missing END:RECORD)", function() {
            const fileData = "BEGIN:RECORD\nIDENTIFIER: 123\nTIME: 20240401T123000\n";
            const result = getRecords(fileData);
            expect(result).toBeNull();
        });

    });
    
    describe("getProperties function", function() {
        it("should correctly extract properties from a record string", function() {
            const recordString = "BEGIN:RECORD\nIDENTIFIER: 123\nTIME: 20240401T123000\nEND:RECORD";
            const result = getProperties(recordString);
            expect(result).toEqual({
                IDENTIFIER: '123',
                TIME: '20240401T123000'
            });
        });
    
        it("should correctly extract all properties including optional ones", function() {
            const recordString = 
                "BEGIN:RECORD\n" +
                "IDENTIFIER: 124\n" +
                "TIME: 20240501T123000\n" +
                "WEIGHT: 70\n" +
                "UNITS: kg\n" +
                "COLOR: #AABBCC\n" +
                "END:RECORD";
            const result = getProperties(recordString);
            expect(result).toEqual({
                IDENTIFIER: '124',
                TIME: '20240501T123000',
                WEIGHT: '70',
                UNITS: 'kg',
                COLOR: '#AABBCC'
            });
        });
    
        it("should handle incorrect formatting in the record string", function() {
            const recordString = 
                "BEGIN:RECORD\n" +
                "IDENTIFIER 125\n" + // Missing colon
                "TIME20240601T123000\n" + // Missing colon
                "WEIGHT: 80 UNITS: lb\n" + // Properties on the same line
                "COLOR: #FFCCDD\n" +
                "END:RECORD";
            const result = getProperties(recordString);
            expect(result).toBeNull();
            
        });
    });
    

    describe("validateRecord function", function() {

        it("should recognize valid record properties", function() {
            const recordProperties = {
                IDENTIFIER: '123',
                TIME: '20240401T123000',
                COLOR: '#FFCCDD'
            };
            expect(validateRecord(recordProperties)).toBe(true);
        });
    
        it("should fail with missing mandatory properties", function() {
            const recordProperties = {
                TIME: '20240401T123000',
                UNITS: 'kg'
            };
            expect(validateRecord(recordProperties)).toBe(false);
        });

        it("should fail with an unrecignized properties", function() {
            const recordProperties = {
                IDENTIFIER: '123',
                TIME: '20240401T123000',
                BASEBALL: '32'
            };
            expect(validateRecord(recordProperties)).toBe(false);
        });
    
        it("should fail when WEIGHT is present but UNITS is missing", function() {
            const recordProperties = {
                IDENTIFIER: '123',
                TIME: '20240401T123000',
                WEIGHT: '55'
                // UNITS is intentionally missing
            };
            expect(validateRecord(recordProperties)).toBe(false);
        });

        it("should fail when UNITS is present but WEIGHT is missing", function() {
            const recordProperties = {
                IDENTIFIER: '123',
                TIME: '20240401T123000',
                UNITS: 'pounds'
                // WEIGHT is intentionally missing
            };
            expect(validateRecord(recordProperties)).toBe(false);
        });

        it("should fail when UNITS is present but invalid", function() {
            const recordProperties = {
                IDENTIFIER: '123',
                TIME: '20240401T123000',
                WEIGHT: '55',
                UNITS: 'invalidunit'
            };
            expect(validateRecord(recordProperties)).toBe(false);
        });
    
        it("should pass when both WEIGHT and valid UNITS are present", function() {
            const recordProperties = {
                IDENTIFIER: '123',
                TIME: '20240401T123000',
                WEIGHT: '55',
                UNITS: 'kg'
            };
            expect(validateRecord(recordProperties)).toBe(true);
        });
    
        it("should fail when COLOR is present but invalid", function() {
            const recordProperties = {
                IDENTIFIER: '123',
                TIME: '20240401T123000',
                COLOR: 'ZZZ999' // Invalid HEX color code
            };
            expect(validateRecord(recordProperties)).toBe(false);
        });
    
        it("should pass when COLOR is a valid hex color code", function() {
            const recordProperties = {
                IDENTIFIER: '123',
                TIME: '20240401T123000',
                COLOR: '#FFFFFF' // Valid HEX color code
            };
            expect(validateRecord(recordProperties)).toBe(true);
        });
    
    });
    

    describe("isValidTime function", function() {
        it("should return true for a valid time string", function() {
            const input = "20240401T123000";
            expect(isValidTime(input)).toBe(true);
        });
    
        it("should return false for an invalid time string (wrong format)", function() {
            const input = "20240401_123000"; // Invalid separator
            expect(isValidTime(input)).toBe(false);
        });
    
        it("should return false for an invalid time string (invalid month)", function() {
            const input = "20241301T123000"; // Month 13 doesn't exist
            expect(isValidTime(input)).toBe(false);
        });
    
        it("should return false for an invalid time string (invalid day)", function() {
            const input = "20240230T123000"; // February does not have 30 days
            expect(isValidTime(input)).toBe(false);
        });
    
        it("should return true for a leap year February 29th", function() {
            const input = "20200229T123000"; // 2020 is a leap year, February has 29 days
            expect(isValidTime(input)).toBe(true);
        });
    
        it("should return false for an invalid time string (invalid hour)", function() {
            const input = "20240401T250000"; // Hour 25 does not exist
            expect(isValidTime(input)).toBe(false);
        });
    
        it("should return false for an invalid time string (invalid minute)", function() {
            const input = "20240401T236000"; // Minute 60 does not exist
            expect(isValidTime(input)).toBe(false);
        });
    
        it("should return false for an invalid time string (invalid second)", function() {
            const input = "20240401T230060"; // Second 60 does not exist
            expect(isValidTime(input)).toBe(false);
        });

    });
    

    describe("sortRecords function", function() {
        it("should sort records by the TIME property", function() {
            const recordsWithProperties = [
                { IDENTIFIER: '123', TIME: '20240401T123000' },
                { IDENTIFIER: '124', TIME: '20240301T123000' },
                { IDENTIFIER: '125', TIME: '20240501T123000' }
            ];
            const sortedRecords = sortRecords(recordsWithProperties);
            
            // Verify the order of the records by their TIME property
            expect(sortedRecords[0].IDENTIFIER).toBe('124'); // Should be the record with the earliest TIME
            expect(sortedRecords[1].IDENTIFIER).toBe('123'); // Should be the record with the next earliest TIME
            expect(sortedRecords[2].IDENTIFIER).toBe('125'); // Should be the record with the latest TIME
        });

    });

});
