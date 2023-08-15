import { FileUtils } from '../src/core';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const INPUT_CONTENT = `01380006302
014810000225
014921802.00
01930000000002191
0153101Müller
0143102Agnes
017310330061922
0213107Wannenstr. 7
01031102
023310679106 Freiburg
01641110000000
01341121000
014410400000
01041212
0128402BDT
`;

const INPUT_FILE_NAME = 'TERMPAIN.GDT';

const TMP_DIR = os.tmpdir();

/**
 * FileUtils tests
 */
describe('Reading xDT lines', () => {
	beforeAll(() => {
		fs.writeFileSync(
			path.join(TMP_DIR, INPUT_FILE_NAME),
			INPUT_CONTENT.split('\n').join('\r\n'),
			{ encoding: 'binary' }
		);
	});

	it('the imported lines are correct', async () => {
		const lines = await FileUtils.readLines(
			path.join(TMP_DIR, INPUT_FILE_NAME)
		);
		expect(lines.join('\n')).toBe(INPUT_CONTENT);
	});

	afterAll(() => {
		fs.unlinkSync(path.join(TMP_DIR, INPUT_FILE_NAME));
	});
});
