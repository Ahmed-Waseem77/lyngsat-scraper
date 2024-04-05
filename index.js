const puppeteer						= require('puppeteer');	 

const { colors, format }	= require('./ansi');
const satScrape						= require('./sat-scrape');
const satLaunchesScrape		= require('./satLaunch-scrape');
const satChannelsScrape		= require('./satChannel-scrape'); 
const { regions, url } 		= require('./config');
const fs 									= require('fs');
const { joinJSON }				= require('./utils');


const main = async () => {

  const args = process.argv.slice(2);

	fs.writeFileSync('./satChannelData.json', '[\n]');	

	if ( args.includes('-h') || args.includes('--help') ) {
		console.log(colors.magenta+ format.bold + 
			'Usage: scraping lyngsat\n\n' + colors.reset + colors.green + 
			'	[-v | --verbose] \n	Verbose output, prints all scraped data on console and process\n\n' +
			'	[-h | --help] \n	Prints Help \n\n' +
			' [-hs | --headless]\n	Runs the browser in headless mode\n\n' +
			'	[-wl | --without-launches]\n	Skips scraping of launch data\n\n' +
			'	[-wc | --without-channels]\n	Skips scraping of channel data\n\n'

			+ colors.reset);
		return;
	}
	
	if (args.includes('-hs') || args.includes('--headless')) {
		browser = await puppeteer.launch({ headless: true });
	}
	else {
		browser = await puppeteer.launch({ headless: false });
	}
	console.log('Browser opened');

	console.log( colors.magenta + format.bold + 'scraping satellites..' + colors.reset);
	satData = await satScrape(browser, regions, url);

	satellites = satData.map(sat => sat.satellite);
	console.log( satellites.length + ' satellites found');
	
	if (!(args.includes('-wc') || args.includes('--without-channels'))) {
		console.log( colors.magenta + format.bold + 'scraping channels..' + colors.reset);
		channelData = await satChannelsScrape(browser, satellites , url);
	}
	else {
		channelData = [];
	}

	if (!(args.includes('-wl') || args.includes('--without-launches'))) {
		console.log( colors.magenta + format.bold + 'scraping launches..' + colors.reset);
		launchData = await satLaunchesScrape(browser, satellites, url);	
	}
	else {
		launchData = [];
	}

	// testing arguement to test any functionality independently
	if(args.includes('-t') || args.includes('--test')) {
		console.log(colors.green + 'No Unit Tests Being Done' + colors.reset);
		return;
	}

	// print data if -v flag is passed
	if (args.includes('-v') || args.includes('--verbose')) {
		console.log( colors.cyan + format.bold + '\n\nSatellite data:\n' + colors.reset, satData);
		console.log( colors.cyan + format.bold + '\n\nLaunch data:\n' + colors.reset, launchData);
		console.log( colors.cyan + format.bold + '\n\nChannel data:\n' + colors.reset, channelData);
	}
	
	let joinedSats = joinJSON(satData, launchData, 'satellite');
	fs.writeFileSync('./final_satelliteData.json', JSON.stringify(joinedSats, null, 2));

	console.log(colors.green + 'Scraping complete' + colors.reset);
	await browser.close();
}

main();
