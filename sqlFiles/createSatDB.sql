CREATE database if not exists TVDB;

use TVDB;

CREATE TABLE Satellites (
    satellite        VARCHAR(200)     NOT NULL    PRIMARY KEY,
    launchData     VARCHAR(200),
    launchRocket   VARCHAR(200),
    launchDate     DATETIME,
    band			varchar(20),
    position        VARCHAR(200),
    region          VARCHAR(200)
);

CREATE TABLE Providers (
    providerName          VARCHAR(200)     NOT NULL    PRIMARY KEY,
    providerWebsite         VARCHAR(200),
    providerLogo            VARCHAR(200),
    providerCountry		VARCHAR(200),
    satellite        VARCHAR(200),		
    CONSTRAINT      FOREIGN KEY(satellite)
                    REFERENCES Satellites(satellite)
);

CREATE TABLE Channels (
    tvChannelName    VARCHAR(200)     NOT NULL    PRIMARY KEY,
    tvChannelLogo            VARCHAR(200),
    tvChannelWebsite         VARCHAR(200),
    tvChannelCountry	VARCHAR(200),
    providerName   VARCHAR(200),
    CONSTRAINT      FOREIGN KEY(providerName) REFERENCES Providers(providerName)
);

CREATE TABLE Users (
    user_email      VARCHAR(200)     NOT NULL    PRIMARY KEY,
    username        VARCHAR(200)     NOT NULL,
    region          VARCHAR(200)     NOT NULL,
    dob             DATETIME,
    gender          CHAR(1) /*M or F*/
);

CREATE TABLE Favorites (
    user_email      VARCHAR(200)     NOT NULL,
    tvChannelName    VARCHAR(200)     NOT NULL,
    CONSTRAINT      PRIMARY KEY(user_email, tvChannelName),
    CONSTRAINT      FOREIGN KEY(user_email)
                    REFERENCES Users(user_email),
    CONSTRAINT      FOREIGN KEY(tvChannelName)
                    REFERENCES Channels(tvChannelName)
);

CREATE TABLE Have (
    satellite        VARCHAR(200), -- PK FK
    tvchannel    VARCHAR(200), -- PK FK
    video  VARCHAR(200),
    beam            VARCHAR(200),
    SRFEC             VARCHAR(200),
    sat_system      VARCHAR(200),
    freq   VARCHAR(200),
    lang        	VARCHAR(200), -- FK
    encryptions     VARCHAR(200), -- FK
    CONSTRAINT      PRIMARY KEY(satellite, tvchannel),
    CONSTRAINT      FOREIGN KEY(satellite)
                    REFERENCES Satellites(satellite),
    CONSTRAINT      FOREIGN KEY(tvchannel)
                    REFERENCES Channels(tvChannelName)
);
