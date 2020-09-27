const axios = require('axios')
const puppeteer = require('puppeteer')
const cheerio = require("cheerio")
require('dotenv').config()
const Discord = require('discord.js')

let startingBan = process.env.INITIAL_BAN
const threshhold = process.env.THRESHHOLD || 4;

const WEBHOOK_ID = process.env.WEBHOOK_LINK.split("/").slice(5)[0]
const WEBHOOK_TOKEN = process.env.WEBHOOK_LINK.split("/").slice(5)[1]

const baseRglUrl = "https://rgl.gg/Public/"
const rglUrl = "https://rgl.gg/Public/PlayerBanList.aspx"

const role = process.env.MENTION_ROLE

const interval = 20 * 60000

setInterval(async () => await checkRglPage(), interval)

checkRglPage()

async function checkRglPage() {
    const { data } = await axios(rglUrl)
    const body = data

    const $ = cheerio.load(body)

    let names = ``;
    let elementIds = ``;
    let profileLinks = ``;

    const reasonArray = [];

    $("tbody > tr").each((index, element) => {
        if (index % 2 !== 0) {
            reasonArray.push($($(element).find("tr > td > div")).text().trim())
        }
        if (index % 2 === 0) {
            names += $($(element).find("td")[1]).text().trim() + " "
            profileLinks += $($(element).find("a")[0]).attr('href') + " "
            elementIds += $(element).attr('id') + " "
        }
    })

    const elementIdArray = elementIds.trim().split(' ')
    const profileLinksArray = profileLinks.trim().split(' ')
    const namesArray = names.trim().split(' ')

    if (elementIdArray[0] === startingBan) return console.log("No new ban")
    else {
        if (elementIdArray[0] - 1 == startingBan) {
            console.log(`1 new ban detected`)
            const buffer = await takeScreenshot(rglUrl, elementIdArray[0])
            await sendMessage(buffer, profileLinksArray[0], namesArray[0], startingBan, reasonArray[0])
            startingBan = elementIdArray[0];
        } else {
            const lower = startingBan;
            startingBan = elementIdArray[0];

            console.log(`${elementIdArray[0] - lower} new bans detected`)
            if (elementIdArray[0] - lower > threshhold) await sendWarningMessage(elementIdArray[0] - lower)
            await sendManyMessages(elementIdArray[0] - lower, elementIdArray, profileLinksArray, namesArray, reasonArray)
        }
    }

}

async function sendManyMessages(difference, elementIdArray, linkArray, namesArray, reasonArray) {
    const elSorted = elementIdArray.slice(0, difference).reverse()
    const linkSorted = linkArray.slice(0, difference).reverse()
    const namesSorted = namesArray.slice(0, difference).reverse()
    const reasonSorted = reasonArray.slice(0, difference).reverse()

    for (let i = 1; i <= difference; i++) {
        const buffer = await takeScreenshot(rglUrl, elSorted[i - 1])
        await sendMessage(buffer, linkSorted[i - 1], namesSorted[i - 1], elSorted[i - 1], reasonSorted[i - 1])
    }
}


async function sendMessage(buffer, link, name, amount, reason) {
    const webhookClient = new Discord.WebhookClient(WEBHOOK_ID, WEBHOOK_TOKEN);
    const att = new Discord.MessageAttachment(buffer, "buffer.png")

    await webhookClient.send('', {
        files: [att],
        embeds: [{
            title: `${name} banned`,
            color: 15158332,
            description: `<@&${role}>\n${banAmountString(amount)}\n\n**Reason:**\n${reason}`,
            url: baseRglUrl + link,
            image: {
                url: `attachment://buffer.png`
            }
        }]
    });
}


async function sendWarningMessage(amount) {
    const webhookClient = new Discord.WebhookClient(WEBHOOK_ID, WEBHOOK_TOKEN);

    await webhookClient.send('', {
        embeds: [{
            title: `Ban wave detected`,
            color: 15105570,
            description: `This ban wave contains ${amount} bans.`,
            url: rglUrl,
        }]
    });
}

function ordinalSuffixOf(i) {
    const j = i % 10,
        k = i % 100
    if (j == 1 && k != 11) {
        return i + 'st'
    }
    if (j == 2 && k != 12) {
        return i + 'nd'
    }
    if (j == 3 && k != 13) {
        return i + 'rd'
    }
    return i + 'th'
}

function banAmountString(number) {
    const responseArray = [
        `This is the **${ordinalSuffixOf(number)}** ban.`,
        `We've arrived at the **${ordinalSuffixOf(number)}** ban!`,
        `In total, we've had **${number}** bans at rgl.gg!`,
        `Today's the day we get rgl.gg's **${ordinalSuffixOf(number)}** ban.`,
        `How the hell have we reached **${number}** bans?`,
        `Another ban at rgl.gg, with their total at **${number}**!`,
    ]

    return responseArray[responseArray.length * Math.random() | 0]
}

async function takeScreenshot(url, element) {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    })

    const page = await browser.newPage()
    await page.goto(url)

    await page.$$eval('.glyphicon-plus', links => links.forEach(link => link.click()))

    await page.waitFor(250)

    const options = {
        top: {
            selector: `[data-target="#LFT-${element}"]`,
            edge: "top"
        },
        bottom: {
            selector: `[data-target="#LFT-${element}"] + *`,
            edge: "bottom"
        },
        left: {
            selector: "table",
            edge: "left"
        },
        right: {
            selector: "table",
            edge: "right"
        }
    }

    const clipBounds = await page.evaluate((options) => {
        let bounds = {
            x: 0,
            y: 0,
            width: document.body.clientWidth,
            height: document.body.clientHeight
        };
        ["top", "left", "bottom", "right"].forEach(edge => {
            let currentOption = options[edge];
            if (!currentOption) return;

            if (typeof currentOption == "number") {
                if (edge == "top") bounds.y = currentOption;
                if (edge == "left") bounds.x = currentOption;
                if (edge == "bottom") bounds.height = currentOption - (bounds.y);
                if (edge == "right") bounds.width = currentOption - (bounds.x);
            } else if (typeof currentOption == "object") {
                if (!document.querySelector((currentOption).selector)) throw new Error("Top element not found.");

                let element = document.querySelector((currentOption).selector);
                let boundingClientRect = element.getBoundingClientRect();

                if (edge == "top") bounds.y = boundingClientRect[(currentOption).edge];
                if (edge == "left") bounds.x = boundingClientRect[(currentOption).edge];
                if (edge == "bottom") bounds.height = boundingClientRect[(currentOption).edge] - (bounds.y);
                if (edge == "right") bounds.width = boundingClientRect[(currentOption).edge] - (bounds.x);
            }
        });

        return bounds;
    }, options)

    let screenshotBuffer = await page.screenshot({
        clip: clipBounds,
        encoding: "binary"
    })

    await browser.close()

    return screenshotBuffer
}