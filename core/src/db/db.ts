import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Connection, getConnectionManager, BaseEntity } from 'typeorm';
import * as path from 'path';

/**
 * Shared SQLite database manager
 */
export abstract class Db {
	readonly connection: Connection;

	readonly databaseFilePath: string;

	/**
	 * @param filePath path to the SQLite database file
	 * @param connectionName TypeORM connection name, default to "default"
	 */
	constructor(
		folderPath: string,
		fileName: string,
		entities: typeof BaseEntity[],
		connectionName: string = 'default',
		verbose: boolean = false
	) {
		this.databaseFilePath = path.join(folderPath, fileName);
		const connectionManager = getConnectionManager();
		if (connectionManager.has(connectionName)) {
			this.connection = connectionManager.get();
		} else {
			this.connection = connectionManager.create({
				name: connectionName,
				type: 'sqlite',
				database: this.databaseFilePath,
				entities,
				logging: verbose ? ['error', 'query'] : ['error'],
				namingStrategy: new SnakeNamingStrategy()
			});
			for (const entity of entities) {
				entity.useConnection(this.connection);
			}
		}
	}

	/**
	 * Opens connection.
	 */
	async open() {
		if (this.connection.isConnected) {
			throw new Error('Already connected to the database!');
		}
		await this.connection.connect();
		await this.connection.synchronize(); // TODO: Disable and implement migration
	}

	/**
	 * Closes connection.
	 */
	async close() {
		if (!this.connection.isConnected) {
			throw new Error('Not connected to the database!');
		}
		await this.connection.close();
	}
}
