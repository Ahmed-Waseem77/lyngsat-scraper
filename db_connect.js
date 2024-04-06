const mysql = require('mysql2');
const fs = require('fs');


function connectAndInsertData() {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'weso',
        password: 'weso',
        database: 'TVDB'
    });

    connection.connect((err) => {
        if (err) throw err;
        console.log('Connected to the MySQL server.');

        // read JSON files and insert data into the database

        fs.readFile('./clean_satelliteData.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            const satelliteData = JSON.parse(data);
            satelliteData.forEach((satellite) => {
                connection.query('INSERT INTO Satellites SET ?', satellite, (err, res) => {
                    if (err) throw err;
                    console.log('Inserted satellite with ID: ' + res.insertId);
                });
            });
        });

        fs.readFile('./clean_providerData.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            const providerData = JSON.parse(data);
            providerData.forEach((provider) => {
                connection.query('INSERT INTO Providers SET ?', provider, (err, res) => {
                    if (err) {
                    throw err;
                    };
                    console.log('Inserted provider with ID: ' + res.insertId);
                });
            });
        });

        fs.readFile('./clean_tvChannelData.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            const tvChannelData = JSON.parse(data);
            tvChannelData.forEach((channel) => {
                connection.query('INSERT INTO Channels SET ?', channel, (err, res) => {
                    if (err) { throw err } 
                    console.log('Inserted TV channel with ID: ' + res.insertId);
                });
            });
        });

        fs.readFile('./clean_satChannelData.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            const satChannelData = JSON.parse(data);
            satChannelData.forEach((channel) => {
                connection.query('INSERT INTO Have SET ?', channel, (err, res) => {
                    if (err) { 
                        console.error(err);
                        return;
                    };
                    console.log('Inserted satellite channel with ID: ' + res.insertId);
                });
            });
        }); 

    });
}

module.exports = connectAndInsertData;