const utils = require('./utils.js');
const fs = require('fs');

const satLaunchesScrape = async (browser, satellites, url) => {
    // profiling the scraping of launch data
    console.time('launchesScrape');

    const pagePromises = [];
    const satLaunchesData = [];
    
    // convert satellite names to URL format
    const satellitesConverted = satellites.map(sat => utils.convertToUrl(sat));

    // create an array of promises for page navigation concurrency
    for (let i = 0; i < satellitesConverted.length; i++) {
        pagePromises.push(browser.newPage().then(async (page) => {
            await page.goto(url + 'tracker/' + satellitesConverted[i] + '.html');

            const satLaunch = await page.evaluate((satellite) => {
                const allFonts = Array.from(document.querySelectorAll('font'));
                const targetFontTag = allFonts.find(font => font.innerText.includes('launched'));
                let targetText = '';

                if (targetFontTag) {
                    targetText = targetFontTag.innerText;
                } else {
                    targetText = null;
                }

                if (allFonts.some(font => font.innerText === "The page you tried to access doesn't exist.")) {
                    return {
                        satellite: satellite,
                        launchData: null,
                        launchDate: null,
                        launchRocket: null
                    };
                } else {
                    return {
                        satellite: satellite,
                        launchData: targetText === null ? null : targetText.split('\n').filter(text => text.includes('launched'))[0],
                        launchDate: targetText === null ? null : targetText.match(/\d{4}-\d{2}-\d{2}/)[0],
                        launchRocket: targetText === null ? null : targetText.match(/(?<=with\s)(.*?)(?=\d{4}-\d{2}-\d{2})/)[0].trim(0)
                    };
                }
            }, satellites[i]);

            satLaunchesData.push(satLaunch);
            await page.close();
        }));
        
        // run only 3 pages simultaneously
        if (pagePromises.length === 3 || i === satellitesConverted.length - 1) {
            await Promise.all(pagePromises);
            // write satLaunchesData to file
            fs.writeFileSync('satLaunchesData.json', JSON.stringify(satLaunchesData, null, 2));
            pagePromises.length = 0;
        }
    }
    
    console.timeEnd('launchesScrape');
    return satLaunchesData;
};

module.exports = satLaunchesScrape;
