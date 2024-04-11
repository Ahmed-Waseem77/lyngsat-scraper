const util = require('./utils');

const packageScrape = async (browser, page, url) => {

	console.log('Found Package: ' + url);
	console.log('Scraping Package Channels...');
	
	await page.goto(url, { waitUntil: 'domcontentloaded' });
	page.setDefaultTimeout(500000000);

	filteredTables = [];
	const tables = await page.$$('table');

	for (let table of tables) {
		const firstRow = await table.$('tr:first-child');
		if (firstRow) {
			const firstRowText = await page.evaluate(row => row.innerText, firstRow);
			if (firstRowText.includes('last updated')) {
				filteredTables.push(table);
			}
		}
	}

	console.log('Filtered Tables: ' + filteredTables.length);

	links = [];
	for (let table of filteredTables) {
		links.push(await table.$$('a').then(async links => {
			return await Promise.all(links.map(async link => {
				return await page.evaluate(link => link.href, link);
			}));
		}));
	}

	links = links.flat();
	
	links = [...new Set(links)];
	const includedLinkPatterns = /(.com\/tvchannels\/)/;
	links = links.filter(link => includedLinkPatterns.test(link));

	console.log('Found Channels: ' + links.length);
	return links;
}

module.exports = packageScrape;
