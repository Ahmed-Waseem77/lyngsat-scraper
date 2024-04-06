const {colors, format} = require('./ansi');
const utils = require('./utils');
const regions = require('./config').regions;
const packageScrape = require('./packages-scrape');
const fs = require('fs');
const { channel } = require('diagnostics_channel');

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

	console.log('Grouped Links: ' + groupedLinks.length);
	return groupedLinks;
}


const satChannelExtractor = async (satellite, channelName, page) => {

    const relationsObjsArray = [];
    const tableSelector = 'table[width="700"][cellpadding="0"][cellspacing="0"][border="1"] tr:not(:first-child)';

    const rows = await page.$$(tableSelector);

    // loop through the rows extract text from columns
    for (let row of rows) {
        const cells = await row.$$('td');

        const satellite = await cells[1]?.getProperty('textContent') || null;
				if (satellite === null) { continue; }
        const satelliteText = await satellite.jsonValue();
				if (satelliteText === 'Satellite') { continue; }

        const beam = await cells[2]?.getProperty('textContent') || null;
				if (beam === null) { continue; }
        const freq = await cells[3]?.getProperty('textContent') || null;
				if (freq === null) { continue; }
        const system = await cells[4]?.getProperty('textContent') || null;
				if (system === null) { continue; }
        const SRFEC = await cells[5]?.getProperty('textContent') || null;
				if (SRFEC === null) { continue; }
        const video = await cells[6]?.getProperty('textContent') || null ;
				if (video === null) { continue; }
        const lang = await cells[7]?.getProperty('textContent') || null;
				if (lang === null) { continue; }
        const encryption = await cells[8]?.getProperty('textContent') || null;
				if (encryption === null) { continue; }

        const beamText = await beam.jsonValue();
        const freqText = await freq.jsonValue();
        const systemText = await system.jsonValue();
        const SRFECText = await SRFEC.jsonValue();
        const videoText = await video.jsonValue();
        const langText = await lang.jsonValue();
        const encryptionText = await encryption.jsonValue();

        console.log(satelliteText, channelName, beamText, freqText, systemText, SRFECText, videoText, langText, encryptionText);

        const relationsObj = {
            satellite: satelliteText.trim(),
			tvchannel: channelName.trim(),
            beam: beamText.trim(),
            freq: freqText.trim(),
            system: systemText.trim(),
            SRFEC: SRFECText.trim(),
            video: videoText.trim(),
            lang: langText.trim(),
            encryption: encryptionText.trim()
        };


        relationsObjsArray.push(relationsObj);
    }
    return relationsObjsArray;
}


const satChannelsScrape = async (browser, satellites, url) => {
	const page = await browser.newPage();
	satChannelData = [];
	satellitesConverted = satellites.map(sat => utils.convertToUrl(sat));
	const providerDataObjArray = [];
	const tvChannelDataObjArray = [];
	const satChannelDataObjArray = [];

	const satChannelRelationshipFilepath = './final_satChannelData.json';
	const tvChannelFilepath = './final_tvChannelData.json';
	const providerFilepath = './final_providerData.json';

	// write empty array to files if they are empty

	fs.readFile(satChannelRelationshipFilepath, 'utf8', (err, data) => {
		if (err) {
			return;
		}

		if (data === '') {
			fs.writeFile(satChannelRelationshipFilepath, '[\n]', 'utf8', (err) => {
				if (err) {
				  console.error(err);
				  return;
				}
				console.log('Empty array written to file');
			});
		}
	});

	fs.readFile(tvChannelFilepath, 'utf8', (err, data) => {
		if (err) {
			return;
		}

		if (data === '') {
			fs.writeFile(tvChannelFilepath, '[\n]', 'utf8', (err) => {
				if (err) {
				  console.error(err);
				  return;
				}
				console.log('Empty array written to file');
			});
		}
	});


	fs.readFile(providerFilepath, 'utf8', (err, data) => {
		if (err) {
			return;
		}

		if (data === '') {
			fs.writeFile(providerFilepath, '[\n]', 'utf8', (err) => {
				if (err) {
				  console.error(err);
				  return;
				}
				console.log('Empty array written to file');
			});
		}
	});

	// loop through all satellites
	for (let i=0; i<satellites.length; i++) {
		satelliteURL = url + satellitesConverted[i] + '.html';
		await page.goto(satelliteURL, { waitUntil: 'domcontentloaded'}); 
		j = i + 1;
		console.log('\nScraping Sattellite ' + j + ' : ' + satellitesConverted[i]);
		console.log(colors.blue + format.underline + url + satellitesConverted[i] + '.html' + colors.reset);

		// get all links on the page
		const groupedLinks = await linkScraperAndFilter(browser, page, satellitesConverted[i]);

		// append links json to a file 
		// read the existing data from the JSON file


		// need to have 3 routines here 
		// 1) to construct a json for every channel data					
		// 2) construct a json for satellite channel relationship 
		// 3) construct a json for every provider data						
		
		// loop on groupedLinks	
		// for each provider, get the provider data 
		// for each tvchannel, get the tvchannel data
		// construct a json object and append to an array for sat channel relationship
		// append the sat channel relationship to a file
	
		// providers
		const providerNameSelector		= 'body > div > table > tbody > tr > td:nth-child(2) > table:nth-child(2) > tbody > tr:nth-child(1) > td > font > b > font';
		const providerLogoSelector 		= 'body > div > table > tbody > tr > td:nth-child(2) > table:nth-child(7) > tbody > tr > td:nth-child(1) > img';
		const providerWebsiteSelector = 'body > div > table > tbody > tr > td:nth-child(2) > table:nth-child(7) > tbody > tr > td:nth-child(1) > font:nth-child(3) > a';
		const providerCountrySelector = 'body > div > table > tbody > tr > td:nth-child(2) > table:nth-child(7) > tbody > tr > td:nth-child(1) > font:nth-child(5) > a';
		providerData = {};
	
		// tvchannels 
		const tvChannelSelector					= 'body > div > table > tbody > tr > td:nth-child(2) > table:nth-child(2) > tbody > tr:nth-child(1) > td > font > b > font';
		const tvChannelLogoSelector 		= 'body > div > table > tbody > tr > td:nth-child(2) > table:nth-child(7) > tbody > tr > td:nth-child(1) > img';
		const tvChannelWebsiteSelector	= 'body > div > table > tbody > tr > td:nth-child(2) > table:nth-child(7) > tbody > tr > td:nth-child(1) > font:nth-child(3) > a';
		const tvChannelCountrySelector 	= 'body > div > table > tbody > tr > td:nth-child(2) > table:nth-child(7) > tbody > tr > td:nth-child(1) > font:nth-child(5) > a';
		tvChannelData = {};

		for (let group of groupedLinks) {
				if (group.providerLink === null) { continue; }
				await page.goto(group.providerLink, {waitUntil: 'domcontentloaded'});	 

				const providerNameElements		= await page.$$(providerNameSelector);
				const providerLogoElements 		= await page.$$(providerLogoSelector);
				const providerWebsiteElements = await page.$$(providerWebsiteSelector);
				const providerCountryElements = await page.$$(providerCountrySelector);
			
				const providerName = providerNameElements.length > 0 ? await page.evaluate(el => el.innerText, providerNameElements[0]) : null;
				providerCountry = providerCountryElements.length > 0 ? await page.evaluate(el => el.textContent, providerCountryElements[0]) : null;

				providerData = {
						satellite: satellites[i],
						providerName: providerName,
						providerLogo: providerLogoElements.length > 0 ? await page.evaluate(el => el.src, providerLogoElements[0]) : null,
						providerWebsite: providerWebsiteElements.length > 0 ? await page.evaluate(el => el.href, providerWebsiteElements[0]) : null,
						providerCountry: providerCountry
				};

				utils.appendToJSON(providerFilepath, providerData, (err) => {
					if (err) {
						console.error(err);
					}
				});
				providerDataObjArray.push(providerData); 

				for (let tvChannel of group.tvchannels) {
					if (tvChannel === null) { continue; }
					await page.goto(tvChannel, { waitUntil: 'domcontentloaded' });

					const tvChannelElements					= await page.$$(tvChannelSelector);
					const tvChannelLogoElements 		= await page.$$(tvChannelLogoSelector);
					const tvChannelWebsiteElements	= await page.$$(tvChannelWebsiteSelector);
					const tvChannelCountryElements 	= await page.$$(tvChannelCountrySelector);

					//call satChannelRelationship function
					const tvChannelName = tvChannelElements.length > 0 ? await page.evaluate(el => el.innerText, tvChannelElements[0]) : null;
					const satChannelData = await satChannelExtractor(satellites[i], tvChannelName, page);

					utils.appendToJSON(satChannelRelationshipFilepath, satChannelData, (err) => {
						if (err) {
							console.error(err);
						}
					});

					satChannelDataObjArray.push(satChannelData);

					tvChannelData = {
						providerName: providerName,
						tvChannelName: tvChannelName,
						tvChannelLogo: tvChannelLogoElements.length > 0 ? await page.evaluate(el => el.src, tvChannelLogoElements[0]) : null,
						tvChannelWebsite: tvChannelWebsiteElements.length > 0 ? await page.evaluate(el => el.href, tvChannelWebsiteElements[0]) : null,
						tvChannelCountry: tvChannelCountryElements.length > 0 ? await page.evaluate(el => el.textContent, tvChannelCountryElements[0]) : null
					};

					utils.appendToJSON(tvChannelFilepath, tvChannelData, (err) => {
						if (err) {
							console.error(err);
						}
					});
					tvChannelDataObjArray.push(tvChannelData);	

					//append files


				}

		}

	}	

	await page.close();
	return { providerDataObjArray, tvChannelDataObjArray, satChannelDataObjArray };
}

module.exports = satChannelsScrape;
