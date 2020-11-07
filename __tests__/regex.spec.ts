import { getLinkTextWithSurroudingBracketMatches, getLinkTextWithPathMatches, getNotionMatches, removeUUIDs, cleanUUIdsAndIllegalChar, capReferenceLength, matchMdPathWithoutSpace, notionPathsToReferences } from '../regex';

describe('cleanUri', () => {
	const inputToExpectedOutput = [
		["Quotes DB (source): ../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20do%20not%20rise%20to%20the%20level%20of%20your%20goals%20You%20fal%205ac135a9d86c47fb9b84e2844b73975e.md,",
			"Quotes DB (source): [[You do not rise to the level of your goals Yo]],"],
		["Quotes DB (source): ../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20do%20not%20rise%20to%20the%20level%20of%20your%20goals%20You%20fal%205ac135a9d86c47fb9b84e2844b73975e.md, ../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20should%20be%20far%20more%20concern%20with%20your%20current%20t%20c7e511e4cb6245be8fd5f93ed5d5151b.md, ../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/Because%20of%20how%20we%20are%20wired,%20most%20people%20will%20spen%20276141a45cbf47be809ff81d606804ac.md, ../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/Whatever%20your%20identity%20is%20right%20now,%20you%20believe%20i%2067f373bca64a4796b42ff17d6753ec70.md",
			"Quotes DB (source): [[You do not rise to the level of your goals Yo]], [[You should be far more concern with your curr]], [[Because of how we are wired, most people will]], [[Whatever your identity is right now, you beli]]"],
		["Photo: ../../Quick%20entry%2079d489d307b74bc694c0914c2bc1254a/Concepts%20Facts%20DB%20bef6086345d34a429bda1856581a29da/Untitled%201.png",
			"Photo: [[../../Quick entry/Concepts Facts DB/Untitled 1.png]]"]
	]
	it.each(inputToExpectedOutput)('should correctly parse "%s"', (input: string, expected) => {

		const output = notionPathsToReferences(input);

		expect(output).toStrictEqual(expected)
	})
})


describe('matchMdPathWithoutSpace', () => {
	const inputToExpectedOutput = [
		["Quotes DB (source): ../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20do%20not%20rise%20to%20the%20level%20of%20your%20goals%20You%20fal%205ac135a9d86c47fb9b84e2844b73975e.md,",
			["../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20do%20not%20rise%20to%20the%20level%20of%20your%20goals%20You%20fal%205ac135a9d86c47fb9b84e2844b73975e.md"]],
		["Quotes DB (source): ../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20do%20not%20rise%20to%20the%20level%20of%20your%20goals%20You%20fal%205ac135a9d86c47fb9b84e2844b73975e.md, ../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20should%20be%20far%20more%20concern%20with%20your%20current%20t%20c7e511e4cb6245be8fd5f93ed5d5151b.md, .",
			["../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20do%20not%20rise%20to%20the%20level%20of%20your%20goals%20You%20fal%205ac135a9d86c47fb9b84e2844b73975e.md", "../../../DBs%201c5c6855aa17434b95582b65e1b6c6f9/Knowledge%203e3346c60ac34d08b697d9d778444c81/Quotes%20DB%208e27bd56e94f4e64b051a9353f6c100c/You%20should%20be%20far%20more%20concern%20with%20your%20current%20t%20c7e511e4cb6245be8fd5f93ed5d5151b.md"]],
		["Photo: ../../Quick%20entry%2079d489d307b74bc694c0914c2bc1254a/Concepts%20Facts%20DB%20bef6086345d34a429bda1856581a29da/Untitled%201.png",
			["../../Quick%20entry%2079d489d307b74bc694c0914c2bc1254a/Concepts%20Facts%20DB%20bef6086345d34a429bda1856581a29da/Untitled%201.png"]],
		["Photo: ../../Quick%20entry%2079d489d307b74bc694c0914c2bc1254a/Concepts%20Facts%20DB%20bef6086345d34a429bda1856581a29da/Untitled%201",
			null]
	]
	it.each(inputToExpectedOutput)('should correctly parse "%s"', (input: string, expected) => {

		const output = matchMdPathWithoutSpace(input);

		expect(output).toStrictEqual(expected)
	})
})

describe('getLinkTextWithPathMatches', () => {
	const inputTextToExpectedLinkWithPath = [
		// Normal link to other note
		["let's get a full match [Mental - Pocket (N)](Mental%20Model%20(Master)%209046d23c4cd340f2854d889061e29548/Mental%20Models%20I%20Find%20Repeatedly%20Useful%20-%20Gabriel%20W%20460d555b62aa404eab75b7a3f188e96e.md) follow up",
			"[Mental - Pocket (N)](Mental%20Model%20(Master)%209046d23c4cd340f2854d889061e29548/Mental%20Models%20I%20Find%20Repeatedly%20Useful%20-%20Gabriel%20W%20460d555b62aa404eab75b7a3f188e96e.md)"],
		// Url link
		["ahaha [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"[test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536)"],
		["ahaha [test](https://www.google.com) test",
			"[test](https://www.google.com)"],
		["🎞️ **Content Creation Dashboard** **(add your link, [template available](https://www.notion.so/yearzero/Content-Machine-Template-371ee5a46e9e498b8f7d51f23e496c4e))**",
			"[template available](https://www.notion.so/yearzero/Content-Machine-Template-371ee5a46e9e498b8f7d51f23e496c4e)"],
		// Image
		["ahaha [test_image](folder/path.png) test",
			"[test_image](folder/path.png)"],
		// Image without file type
		["- [] [Histograms%20and%20kernel%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled](Histograms%20and%20KDE%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled) test",
			"[Histograms%20and%20kernel%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled](Histograms%20and%20KDE%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled)"],
		// Link after todo
		["- [] [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"[test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536)"],
		["- [ ] [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"[test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536)"],
		["- [ ] [test([])](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"[test([])](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536)"],
	]

	it.each(inputTextToExpectedLinkWithPath)('should correctly parse "%s"', (input, expected) => {

		const output = getLinkTextWithPathMatches(input)

		expect(output).toStrictEqual([expected])

	})
});


describe('getLinkTextMatches', () => {
	const inputTextToExpectedLinkText = [
		// Normal link to other note
		["let's get a full match [Mental - Pocket (N)](Mental%20Model%20(Master)%209046d23c4cd340f2854d889061e29548/Mental%20Models%20I%20Find%20Repeatedly%20Useful%20-%20Gabriel%20W%20460d555b62aa404eab75b7a3f188e96e.md) follow up",
			"[Mental - Pocket (N)]("],
		// Url link
		["ahaha [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"[test]("],
		["ahaha [test](https://www.google.com) test",
			"[test]("],
		["🎞️ **Content Creation Dashboard** **(add your link, [template available](https://www.notion.so/yearzero/Content-Machine-Template-371ee5a46e9e498b8f7d51f23e496c4e))**",
			"[template available]("],
		// Image
		["ahaha [test_image](folder/path.png) test",
			"[test_image]("],
		// Image without file type
		["- [] [Histograms%20and%20kernel%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled](Histograms%20and%20KDE%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled) test",
			"[Histograms%20and%20kernel%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled]("],
		// Link after todo
		["- [] [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"[test]("],
		["- [ ] [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"[test]("],
		["- [ ] [test([])](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"[test([])]("],
	]

	it.each(inputTextToExpectedLinkText)('should correctly parse "%s"', (input, expected) => {

		const output = getLinkTextWithSurroudingBracketMatches(input)

		expect(output).toStrictEqual([expected])

	})
});

describe('getNotionMatches', () => {
	const inputTextToExpectedNotionMatches: [string, string | null][] = [
		// Normal link to other note
		["let's get a full match [Mental - Pocket (N)](Mental%20Model%20(Master)%209046d23c4cd340f2854d889061e29548/Mental%20Models%20I%20Find%20Repeatedly%20Useful%20-%20Gabriel%20W%20460d555b62aa404eab75b7a3f188e96e.md) follow up",
			null],
		// Url link
		["ahaha [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536"],
		["ahaha [test](https://www.google.com) test",
			null],
		["🎞️ **Content Creation Dashboard** **(add your link, [template available](https://www.notion.so/yearzero/Content-Machine-Template-371ee5a46e9e498b8f7d51f23e496c4e))**",
			"https://www.notion.so/yearzero/Content-Machine-Template-371ee5a46e9e498b8f7d51f23e496c4e"],
		// Image
		["ahaha [test_image](folder/path.png) test",
			null],
		// Image without file type
		["- [] [Histograms%20and%20kernel%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled](Histograms%20and%20KDE%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled) test",
			null],
		// Link after todo
		["- [] [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536"],
		["- [ ] [test([])](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536"],
	]

	it.each(inputTextToExpectedNotionMatches)('should correctly parse "%s"', (input, expectedFullMatch) => {

		const output = getNotionMatches(input)

		if (expectedFullMatch) {
			expect(output).toStrictEqual([expectedFullMatch])
			//@ts-ignore
			//expect(output.groups).toStrictEqual([expectedFullMatch])
		} else {
			expect(output).toBeNull()
		}

	})
});

describe('removeUUIDs', () => {
	const inputTextWithUUIDToExpectedText: [string, string][] = [
		// Normal link to other note
		["let's get a full match [Mental - Pocket (N)](Mental%20Model%20(Master)%209046d23c4cd340f2854d889061e29548/Mental%20Models%20I%20Find%20Repeatedly%20Useful%20-%20Gabriel%20W%20460d555b62aa404eab75b7a3f188e96e.md) follow up",
			"let's get a full match [Mental - Pocket (N)](Mental%20Model%20(Master)%20/Mental%20Models%20I%20Find%20Repeatedly%20Useful%20-%20Gabriel%20W%20.md) follow up"],
		// Url link
		["ahaha [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"ahaha [test](https://www.notion.so/The-Page-Title-(N)) test"],
		["ahaha [test](https://www.google.com) test",
			"ahaha [test](https://www.google.com) test"],
		["🎞️**Content Creation Dashboard** **(add your link, [template available](https://www.notion.so/yearzero/Content-Machine-Template-371ee5a46e9e498b8f7d51f23e496c4e))**",
			"🎞️**Content Creation Dashboard** **(add your link, [template available](https://www.notion.so/yearzero/Content-Machine-Template))**"],
		// Image
		["ahaha [test_image](folder/path.png) test",
			"ahaha [test_image](folder/path.png) test"],
		// Image without file type
		["- [] [Histograms%20and%20kernel%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled](Histograms%20and%20KDE%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled) test",
			"- [] [Histograms%20and%20kernel%202%20/untitled](Histograms%20and%20KDE%202%20/untitled) test"],
		// Link after todo
		["- [] [test](https://www.notion.so/The-Page-Title-(N)-2d41ab7b61d14cec885357ab17d48536) test",
			"- [] [test](https://www.notion.so/The-Page-Title-(N)) test"],
	]

	it.each(inputTextWithUUIDToExpectedText)('should correctly parse "%s"', (input, expectedFullMatch) => {

		const output = removeUUIDs(input)

		expect(output).toBe(expectedFullMatch)
	})
});

describe('cleanUUIdsAndIllegalChar', () => {
	const inputTextWithUUIDToExpectedText: [string, string][] = [
		// Normal link to other note
		["let's :get a full match [Mental - Pocket (N)](Mental%20Model%20(Master)%209046d23c4cd340f2854d889061e29548/Mental%20Models%20I%20Find%20Repeatedly%20Useful%20-%20Gabriel%20W%20460d555b62aa404eab75b7a3f188e96e.md) follow up",
			"let's  get a full match [Mental - Pocket (N)](Mental%20Model%20(Master)%20 Mental%20Models%20I%20Find%20Repeatedly%20Useful%20-%20Gabriel%20W%20.md) follow up"],
		// Url link
		["🎞️**Content Creation Dashboard**",
			"🎞️  Content Creation Dashboard  "],
		// Image
		["ahaha;test:ahah/b",
			"ahaha;test ahah b"],
		// Image without file type
		["- [] [Histograms%20and%20kernel%202%20c15c33d1f1aa4c88bfd9ba2ac1da4b4a/untitled",
			"- [] [Histograms%20and%20kernel%202%20 untitled"],
		["Ref:1", "Ref 1"],
	]

	it.each(inputTextWithUUIDToExpectedText)('should correctly parse "%s"', (input, expectedFullMatch) => {

		const output = cleanUUIdsAndIllegalChar(input)

		expect(output).toBe(expectedFullMatch.normalize("NFD"))
	})
});

describe('capReferenceLength', () => {
	it('should limite the size of a reference to 50 char', () => {
		const input = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially";

		const output = capReferenceLength(input)

		const expectedOutput = "Lorem Ipsum is simply dummy text of the print";
		expect(output).toBe(expectedOutput)

	})
})
