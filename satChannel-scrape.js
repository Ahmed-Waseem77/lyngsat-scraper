const {colors, format} = require('./ansi');
const utils = require('./utils');
const regions = require('./config').regions;

const linkScraperAndFilter = async (page, url) => {

	const links = await page.evaluate((url, regions) => {		
		const elements = document.querySelectorAll('a');
		links = Array.from(elements).map(element => {
			return element.href;
		});

		// filter out links that are not channels
		providerlinks = links.filter(link => link.includes('/providers/'));	
		tvChannelLinks = links.filter(link => link.includes('.com/tvchannels/'));	
		packagesLinks = links.filter(link => link.includes('/packages/'));

		// exclude package links that have 'packages/<region>' in them
		for (let region of regions)
			packagesLinks = packagesLinks.filter(link => !link.includes('/packages/' + region));

		// remove duplicates
		providerlinks = [...new Set(providerlinks)];
		tvChannelLinks = [...new Set(tvChannelLinks)];
		packagesLinks = [...new Set(packagesLinks)];


			
		return { providerlinks, tvChannelLinks, packagesLinks };
	}, url, regions);

	return links;
}


const satChannelsScrape = async (browser, satellites, url) => {
	const page = await browser.newPage();
	satChannelData = [];
	satellitesConverted = satellites.map(sat => utils.convertToUrl(sat));

	// loop through all satellites
	for (let i=0; i<satellites.length; i++) {
		await page.goto(url + satellitesConverted[i] + '.html'); 
		j = i + 1;
		console.log('\nScraping Sattellite ' + j + ' : ' + satellitesConverted[i]);
		console.log(colors.blue + format.underline + url + satellitesConverted[i] + '.html' + colors.reset);

		// get all links on the page
		const links = await linkScraperAndFilter(page, satellitesConverted[i]);
		console.log(links.providerlinks);
		console.log(links.tvChannelLinks);
		console.log(links.packagesLinks);
	}
	// write satChannelData to file
	// fs.writeFileSync('satChannelData.json', JSON.stringify(satChannelData, null, 2));
	
	
	await page.close();
	return satChannelData;
};


module.exports = satChannelsScrape;
