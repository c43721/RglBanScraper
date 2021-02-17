// Cors must be enabled, since RGL does not have global cors...
const CORS_PROXY = "https://api.allorigins.win/get?url=";
const RGL_BAN_SITE = "https://rgl.gg/Public/PlayerBanList.aspx?r=40";
const BASE_RGL_URL = "https://rgl.gg/Public/PlayerProfile.aspx?p=";

const startingBan = "76561198051819671";
const parser = new DOMParser();

async function getRglBans() {
	const res = await fetch(CORS_PROXY + RGL_BAN_SITE);
	const { contents: text } = await res.json();

	const doc = parser.parseFromString(text, "text/html");

	const banContainer = doc.querySelector("tbody");
	const bans = banContainer.querySelectorAll("tr.collapsed");

	const banArray = [...bans];

	const topMostBan = parseBan(banArray[0]);
	const oneUnderTopBan = parseBan(banArray[1]);

	// Check if the previous ban is the same as the "newest"
	if (topMostBan.steamId === oneUnderTopBan.steamId || topMostBan.steamId === startingBan) {
		//Well, same steam ids. Check their reasons
		//If they're the same, then we have a ban
		if (topMostBan.banReason === oneUnderTopBan.banReason) return console.log("No new ban");
		if (topMostBan.steamId === startingBan) return console.log("No new ban");
	}

	// Now that we know that this ban is probably fresh, let's do some parsing to see how many bans there actually was
	// Find the index of where the last steamid was
	const startingBanIndex = banArray.findIndex(ban => parseBan(ban).steamId === startingBan);

	// Check to see if that starting index has been buried
	if (startingBanIndex === -1)
		return console.log(
			"Either there is >10 bans this interval, or steam id is not formatted correctly."
		);

	const newBans = banArray.splice(0, startingBanIndex);

	const newBanDetails = newBans.map(ban => parseBan(ban));

	// New ban details is the list of all new bans during this interval. Do whatever you want.
	console.log(newBanDetails);
	document.getElementById("bans").innerText = JSON.stringify(newBanDetails);
}

function parseBan(ban) {
	const banReasonContainer = ban.nextSibling;

	const steamId = ban.querySelector("td").innerText.trim();
	const username = ban.querySelector("td > a").innerText.trim();
	const banReason = banReasonContainer.querySelector("div").innerText.trim();
	const linkToProfile = BASE_RGL_URL + steamId;

	return {
		steamId,
		username,
		banReason,
		link: linkToProfile
	};
}

getRglBans();
