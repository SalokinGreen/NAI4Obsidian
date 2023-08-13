import { Entry } from "lorebook";
import checkForKeys from "./checkForKeys";
export default function createLore(lore: Entry[], story: string) {
	// filter lore by 'on'
	let filteredLore = lore.filter((entry) => entry.on);
	// sort lore by 'priority'
	filteredLore.sort((a, b) => a.priority - b.priority);
	// create loreArray
	let loreArray: string[] = [];
	filteredLore.forEach((entry) => {
		// grab string size of entry.searchRange
		const search = story.slice(0, entry.searchRange);
		// check for keys
		const found = checkForKeys(search, entry.keys);
		// if keys found, push entry to loreArray
		found || entry.alwaysOn ? loreArray.push(entry.content) : null;
	});
	// return loreArray
	return loreArray;
}
