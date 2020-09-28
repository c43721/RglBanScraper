# RglBanScraper
 A ban scraper intended to send messages to a disccord channel when a ban is detected.


## Not intended for production use. Use wisely and responsibly. 

Originally intended as a joke, it turned into a side project to test my skills of scraping websites for data. This served as one of my first projects built in 1 day, fix it later type of deal.


### Usage
* Create a file in this folders' root named `.env`.
* Inside that `.env` file, you may include the following:
```
WEBHOOK_LINK* - The complete webhook URL for your discord channel
INITIAL_BAN* - A bit more tricky, you're going to have to inspect element on the RGL ban page and look for [data-target=#LFT-[NUMBER]]. This controls the ban to start from.
MENTION_ROLE - The role ID to mention after every ban
THRESHOLD - The threshhold to send a "Ban wave" notification, currently used to help diagnose false-positives.

* = required
```
* Build the docker image
```
docker build . -t "your tag name here"
```
* Run your image
```
docker run -d [options] "your tag name here"
```

Everything is using docker to help usability. It will work without docker, just run `npm i` to install dependencies, then `node .` to start the program.
