import * as fs from 'fs';

/**
 * Utility class for reading and writing GDT files
 */
export class FileUtils {
	/**
	 * Reads GDT lines from a file.
	 *
	 * @param inputFilePath input file path
	 */
	static async readLines(inputFilePath: string): Promise<string[]> {
		const content = await fs.promises.readFile(inputFilePath, {
			encoding: 'binary'
		});
		return content.split(/\r?\n|\r/);
	}

	/**
	 * Writes GDT lines to a file.
	 *
	 * @param outputFilePath output file paths
	 * @param lines GDT lines
	 */
	static async writeLines(
		outputFilePath: string,
		lines: string[]
	): Promise<void> {
		await fs.promises.writeFile(
			outputFilePath,
			lines.join('\r\n') + '\r\n',
			{
				encoding: 'binary'
			}
		);
	}
}
