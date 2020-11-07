import { testSameOrigin, updateUrlIfYoutube } from '../iframe_converter';

describe('updateUrlIfYoutube', () => {
	const inputToExpectedOutput = [
		["https://github.com/", "https://github.com/"],
		["https://www.youtube.com/watch?v=FY7DtKMBxBw", "https://www.youtube.com/embed/FY7DtKMBxBw"],
		["https://www.youtube.com/embed/FY7DtKMBxBw", "https://www.youtube.com/embed/FY7DtKMBxBw"],
	]
	it.each(inputToExpectedOutput)('should correctly parse "%s"', (input: string, expected) => {

		const output = updateUrlIfYoutube(input);

		expect(output).toStrictEqual(expected)
	})
})
