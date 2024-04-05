const fs = require('fs');

// concurrently scrape all regions
const satScrape = async (browser, regions, url) => {
	console.time('satScrape');
	const page = await browser.newPage();
	satData = [];

	for (let i = 0; i < regions.length; i++) {
		await page.goto(url + '/tracker/' + regions[i] + '.html');

		const satRegionData = await page.evaluate((regions, i) => {
			rows = Array.from(document.querySelectorAll('tr'));

			// filtering rows that have exactly 4 columns
			rows = rows.filter(row => {
				cols = row.querySelectorAll('td');
				return cols.length === 4;
			});

			// extracting data from rows
			// loop through each row, and assign data to an object
			rowData = rows.map(row => {
				cols = row.querySelectorAll('td');

				// we can get some position data beside satellite example: (incl. <degree>) so we remove it
				spanText = cols[1].innerText;
				if (spanText.includes('incl.')) {
					spanText = spanText.split('(')[0].trim();
				}
	
				rowObject = {
					region: regions[i],
					position: cols[0].innerText,	
					satellite:			spanText === '' ? null : spanText,
					band:			cols[2].innerText === '' ? null : cols[2].innerText,
				};

				// remove Object if it has empty values
				if (rowObject.position === '\n' || rowObject.satellite === '\n') {
					return;
				}

				return rowObject;
			});

			// remove null values from the array
			// probably need to include this in a loop above for better performance
			rowData = rowData.filter(row => row !== null || row !== undefined);

			return rowData;
		}, regions, i);

		satData = satData.concat(satRegionData);
		satData = satData.filter(sat => sat?.satellite || false);

	};

	console.timeEnd('satScrape');
	//Write satData to file
	fs.writeFileSync('satData.json', JSON.stringify(satData, null, 2));
	return satData
}

module.exports = satScrape;
