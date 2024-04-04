const {colors, format} = require('./ansi');
const utils = require('./utils');
const regions = require('./config').regions;
const packageScrape = require('./packages-scrape');
const fs = require('fs');

const linkScraperAndFilter = async (browser, page, url) => {

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
	const includedLinkPatterns = /(.com\/tvchannels\/|.providers\/|.packages\/)/;
	links = links.filter(link => includedLinkPatterns.test(link));

	for (let region of regions)
		links = links.filter(link => !link.includes('/packages/' + region));

	const groupedLinks = [];
	let currentGroup = null;

	for (const link of links) {
		isPackage = link.includes('packages');
		if (isPackage) {
			currentPackageLink = link;
			currentPackageChannels = await packageScrape(browser, page, link);
		}

		if (link.includes('provider') || link.includes('packages')) {
			if (currentGroup) {
				groupedLinks.push(currentGroup);
			}
			currentGroup = { providerLink: link, providerTvchannels: [], tvchannels: [] };
		} else {
			if (currentGroup) {
				if (isPackage) {
					currentGroup.providerTvchannels.push(currentPackageChannels);
					currentGroup.providerTvchannels = [...new Set(currentGroup.providerTvchannels)];
				}
				currentGroup.tvchannels.push(link);
				currentGroup.tvchannels = [...new Set(currentGroup.tvchannels)];
			}
		}
	}

	if (currentGroup) {
		groupedLinks.push(currentGroup);
	}

	return groupedLinks;
}

const satChannelsScrape = async (browser, satellites, url) => {
	const page = await browser.newPage();
	satChannelData = [];
	satellitesConverted = satellites.map(sat => utils.convertToUrl(sat));

	// loop through all satellites
	for (let i=0; i<satellites.length; i++) {
		satelliteURL = url + satellitesConverted[i] + '.html';
		await page.goto(satelliteURL); 
		j = i + 1;
		console.log('\nScraping Sattellite ' + j + ' : ' + satellitesConverted[i]);
		console.log(colors.blue + format.underline + url + satellitesConverted[i] + '.html' + colors.reset);

		// get all links on the page
		const groupedLinks = await linkScraperAndFilter(browser, page, satellitesConverted[i]);
		const satelliteGroupedLinks = { satellite: satelliteURL, groupedLinks: groupedLinks };

		// append links json to a file 
		// Read the existing data from the JSON file

		const filePath = './satChannelData.json';
		utils.appendToJSON(filePath, satelliteGroupedLinks, (err) => {
			if (err) {
				console.error('Error appending to JSON file:', err);
			}
		});
		
		
	}
	
	await page.close();
	return satChannelData;
};


module.exports = satChannelsScrape;
