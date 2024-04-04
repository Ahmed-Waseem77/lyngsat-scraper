
//js helper utility functions
//
//

const fs = require('fs');


function appendToJSON(filename, newData, callback) {
    // Read the existing JSON file
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            // If the file doesn't exist or some other error occurred, create a new JSON file
            if (err.code === 'ENOENT') {
                data = '[]'; // Initialize with an empty array
            } else {
                // Pass the error to the callback
                return callback(err);
            }
        }

        let jsonData;
        try {
            // Parse the existing data
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            // If the existing data is not valid JSON, pass the error to the callback
            return callback(parseErr);
        }

        // Append new data to the existing JSON array
        jsonData.push(newData);

        // Convert the updated JSON data back to a string
        const updatedJsonData = JSON.stringify(jsonData, null, 2);

        // Write the updated JSON data back to the file
        fs.writeFile(filename, updatedJsonData, 'utf8', (writeErr) => {
            if (writeErr) {
                // Pass any write error to the callback
                return callback(writeErr);
            }
            
            // If everything is successful, invoke the callback with null (no error)
            callback(null);
        });
    });
}

// regex to convert any whitespace or '/' to '-' (helpful in navigating lyngsat pages)
// also removes any parenthesis and what's inside them
// also removes any special characters to '-'
const convertToUrl = (str) => {
	//replace any omaluts/foreign characters with their latin equivalent
	//same with upper case
	str = str.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
	str = str.replace(/Ä/g, 'A').replace(/Ö/g, 'O').replace(/Ü/g, 'U');
	newstr = str.replace(/\s|\//g, '-').replace(/\(.*\)/g, '').replace(/[^a-zA-Z0-9-]/g, '');
	
	//remove any dashes at the end of the string
	if (newstr[newstr.length - 1] === '-') {
		newstr = newstr.slice(0, -1);
	}
	return newstr;
}

// regex to convert extract YYYY-MM-DD date 
const extractDate = (str) => {
	const date = str.match(/\d{4}-\d{2}-\d{2}/);
	return date ? date[0] : null;
}

//Rocket is after 'with' and before a date of the form 'YYYY-MM-DD'
const extractRocket = (str) => {
	const rocket = str.match(/(?<=with\s)(.*?)(?=\d{4}-\d{2}-\d{2})/);
	return rocket ? rocket[0] : null;
}

module.exports = { convertToUrl, extractDate, extractRocket, appendToJSON };

