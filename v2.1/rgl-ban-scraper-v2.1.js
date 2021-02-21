// Cors must be enabled, since RGL does not have global cors...
const CORS_PROXY = "https://api.allorigins.win/get?url=";
const RGL_BAN_SITE = "https://rgl.gg/Public/PlayerBanList.aspx?r=40";
const BASE_RGL_URL = "https://rgl.gg/Public/PlayerProfile.aspx?p=";

const parser = new DOMParser();
const chartCtx = document.getElementById("rgl-bans").getContext("2d");

const categories = [
	{
		name: "Cheating",
		regex: /Cheating/gi
	},
	{
		name: "Alt",
		regex: /Alt/gi
	},
	{
		name: "Warnings",
		regex: /failure to submit demos/gi
	},
	{
		name: "Toxicity",
		regex: /((hate(ful)?)(\sspeech)?)|((targeted|continued|excessive)\s?harassment)|((anti-|anti\s)*semitic)|(((rac(ial|is+(t|m)))|((homo|trans)phob(ia|ic|e)))?\s(slurs?|comments))/gi
	}
];

async function getRglBans() {
	// Dude, it's 2021: have a public api already...
	const res = await fetch(CORS_PROXY + RGL_BAN_SITE);
	const { contents: text } = await res.json();

	const doc = parser.parseFromString(text, "text/html");

	const banContainer = doc.querySelector("tbody");
	const banArray = [...banContainer.querySelectorAll("tr.collapsed")];

	// Get last 10 bans
	const newBanDetails = banArray.map(ban => parseBan(ban));

	// document.getElementById("bans").innerText = JSON.stringify(newBanDetails);
	return newBanDetails;
}

function parseTypeOfBan(reason) {
	for (const category of categories) {
		const match = category.regex.exec(reason);
		if (match) return category.name;
	}

	// Return default "Other"
	return "Other";
}

function parseBan(ban) {
	const banReasonContainer = ban.nextSibling;

	const steamId = ban.querySelector("td").innerText.trim();
	const username = ban.querySelector("td > a").innerText.trim();
	const expiration = ban.querySelector("td:nth-child(5)").innerText.trim();
	const banReason = banReasonContainer.querySelector("div").innerText.trim();
	const category = parseTypeOfBan(banReason);
	const linkToProfile = BASE_RGL_URL + steamId;

	return {
		steamId,
		username,
		banReason,
		expiration,
		category,
		link: linkToProfile
	};
}

const COLORS = [
	// Cheating
	"green",

	// Alt
	"yellow",

	// Warnings
	"orange",

	// Toxcity
	"red",

	// Other
	"blue"
];

(async () => {
	const bans = await getRglBans();

	console.log(bans);

	const data = [];
	for (const category of categories) {
		data.push(bans.filter(ban => ban.category === category.name).length);
	}

	const myPieChart = new Chart(chartCtx, {
		type: "pie",
		data: {
			labels: [...categories.map(category => category.name), "Other"],
			datasets: [
				{
					label: "Bans",
					data: data,
					backgroundColor: [...COLORS]
				}
			]
		}
	});
})();