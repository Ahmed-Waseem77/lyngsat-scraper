
//js helper utility functions
//


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

module.exports = { convertToUrl, extractDate, extractRocket };

