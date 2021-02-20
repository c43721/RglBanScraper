// Cors must be enabled, since RGL does not have global cors...
const CORS_PROXY = "https://api.allorigins.win/get?url=";
const RGL_BAN_SITE = "https://rgl.gg/Public/PlayerBanList.aspx?r=40";
const BASE_RGL_URL = "https://rgl.gg/Public/PlayerProfile.aspx?p=";

const parser = new DOMParser();

async function getRglBans() {
	const res = await fetch(CORS_PROXY + RGL_BAN_SITE);
	const { contents: text } = await res.json();

	const doc = parser.parseFromString(text, "text/html");

	const banContainer = doc.querySelector("tbody");
	const bans = banContainer.querySelectorAll("tr.collapsed");

	const banArray = [...bans];

	const newBanDetails = banArray.map(ban => parseBan(ban));

	// New ban details is the list of all new bans during this interval. Do whatever you want.
	document.getElementById("bans").innerText = JSON.stringify(newBanDetails);
}

function parseTypeOfBan(reason) {
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

getRglBans();
