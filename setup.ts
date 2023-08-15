import * as fs from 'fs';
import * as path from 'path';
import * as sudo from 'sudo-prompt';
import * as os from 'os';
import * as chmodr from 'chmodr';
import Axios from 'axios';

import * as extract from 'extract-zip';
import { Main } from './service/index';
import * as logger from 'electron-log';
import { Stream } from 'stream';




const ASSETS_BASE_URL = 'https://smart-q.de/update/sq-communicator';

const isWin = process.platform === 'win32';

const DATA_FOLDER = path.join(isWin ? process.env['ALLUSERSPROFILE'] : '/var/lib', 'sq-communicator');



async function sudoExec(cmd: string) {
	return new Promise<void>((resolve, reject) => {
		sudo.exec(cmd, { name: 'smartQ Communicator' }, error => error ? reject(error) : resolve());
	});
}

async function download(source: string, target: string) {
	const response = await Axios.get(source, { responseType: 'stream' });
	const inStream = response.data as Stream;
	const outStream = fs.createWriteStream(target);
	inStream.pipe(outStream);
	await new Promise<void>((resolve, reject) => {
		let error = null;
		outStream.on('error', err => {
			error = err;
			outStream.close();
			reject(err);
		});
		outStream.on('close', () => {
			if (!error) {
				resolve();
			}
		});
	});
}

export function setupEnvironment() {

	return new Promise<void>((resolve, reject) => {
		
		const appFolder = path.join(isWin ? path.dirname(process.env['ComSpec']) : '/etc', 'sq-communicator');
		const dataFolder = path.join(isWin ? process.env['ALLUSERSPROFILE'] : '/var/lib', 'sq-communicator');


		const tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'sq-'));

		const appTmpFolder = path.join(tmpFolder, 'app');
		const dataTmpFolder = path.join(tmpFolder, 'data');

		let reload = false;
		
		fs.mkdir(appTmpFolder ,(err)=>
		{
			if(err){
				logger.info("eroro line  63 :" + err)
				reject("eroro line  63 :" + err)
			}

			

			fs.mkdir(dataTmpFolder ,(err)=>
		{
			if(err){
				logger.info("eroro line  69 :" + err)
				reject("eroro line  69 :" + err)
			}

				const configFileName = 'config.json';
				const configFilePath = path.join(dataFolder, configFileName);
				fs.exists(configFilePath , (exist)=>{
					if(!exist){
						reload = true

						fs.writeFile(configFilePath ,`{ "profiles": {} }`, { encoding: 'utf-8' , flag : "w" } , (err)=>{
							if(err){
								logger.info("eroro line  78 :" + "err")
	
							}
	
							
							
	
	
						} )
	
					}


							const icdDbFileName = 'icd.db';
							const icdDbFilePath = path.join(dataFolder, icdDbFileName);
	
							fs.exists(icdDbFilePath , (exist)=>{
								if(!exist){
									reload = true;
									download(ASSETS_BASE_URL + '/' + icdDbFileName, path.join(dataTmpFolder, icdDbFileName)).then(()=>{
	
										
										
	
									})
				
								}
								

								const main = new Main();
										main.start();
										const cleanUp = async (eventType: string) => {
											logger.info(`${eventType} event received, cleaning up`);
											try { 
												await main.stop();
											} catch (error) {
												logger.info(error);
											}
											logger.info('Done cleaning up');
											process.exit();
										}
								
										[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
											process.on(eventType, cleanUp.bind(null, eventType));
										});
										resolve()
										
	
							})
				
				})

		



		})



		})


		

	})
}
export async function _setupEnvironment() {

	const appFolder = path.join(isWin ? path.dirname(process.env['ComSpec']) : '/etc', 'sq-communicator');
	const dataFolder = path.join(isWin ? process.env['ALLUSERSPROFILE'] : '/var/lib', 'sq-communicator');


	const tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'sq-'));

	const appTmpFolder = path.join(tmpFolder, 'app');
	const dataTmpFolder = path.join(tmpFolder, 'data');

	try {
		fs.mkdirSync(appTmpFolder);
		fs.mkdirSync(dataTmpFolder);

	} catch (error) {
		logger.info("dataTmpFolder :" + "dataTmpFolder")
	}


	const configFileName = 'config.json';
	const configFilePath = path.join(dataFolder, configFileName);
	if (!fs.existsSync(configFilePath)) {
		try {
			fs.writeFileSync(path.join(dataTmpFolder, configFileName), `{ "profiles": {} }`, { encoding: 'utf-8' });
		} catch (error) {
			logger.error(error)
		}

	}

	const icdDbFileName = 'icd.db';
	const icdDbFilePath = path.join(dataFolder, icdDbFileName);
	if (!fs.existsSync(icdDbFilePath)) {
		await download(ASSETS_BASE_URL + '/' + icdDbFileName, path.join(dataTmpFolder, icdDbFileName));
	}

	const serviceFileName = 'sq-service' + (isWin ? '.exe' : '');
	const serviceFilePath = path.join(appFolder, serviceFileName);

	const main = new Main();
		main.start();

		const cleanUp = async (eventType: string) => {
			logger.info(`${eventType} event received, cleaning up`);
			try { 
				await main.stop();
			} catch (error) {
				logger.error(error);
			}
			logger.info('Done cleaning up');
			process.exit();
		}

		[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
			process.on(eventType, cleanUp.bind(null, eventType));
		});


	/* 
	if (!fs.existsSync(serviceFilePath)) {
		const platform = isWin ? 'win' : process.platform === 'darwin' ? 'macos' : 'linux';
		console.log(`${ASSETS_BASE_URL}/${platform}/sq-service.zip`)
		const tmpFilePath = path.join(tmpFolder, 'sq-service.zip');
		await download(`${ASSETS_BASE_URL}/${platform}/sq-service.zip`, tmpFilePath);
		await extract(tmpFilePath, { dir: appTmpFolder });
	}

	const dataTmpFolderFileCount = fs.readdirSync(dataTmpFolder).length;
	const appTmpFolderFileCount = fs.readdirSync(appTmpFolder).length;

	logger.info("dataTmpFolder :" + dataTmpFolder )
	logger.info("appTmpFolder :" + appTmpFolder)
	logger.info(`ASSETS_BASE_URL : ${ASSETS_BASE_URL}`)
	if (dataTmpFolderFileCount || appTmpFolderFileCount) {
		const cmds = [];
		if (dataTmpFolderFileCount) {
			if (!fs.existsSync(dataFolder)) {
				cmds.push(`mkdir "${dataFolder}"`);
			}
			if (isWin) {
				cmds.push(
					`move "${dataTmpFolder}"\\* "${dataFolder}"`
				);
			} else {
				cmds.push(
					`chmod 777 "${dataFolder}"`,
					`mv "${dataTmpFolder}"/* "${dataFolder}"`,
					`chmod 666 "${dataFolder}"/*`
				);
			}
		}

		if (appTmpFolderFileCount) {
			if (!fs.existsSync(appFolder)) {
				cmds.push(`mkdir "${appFolder}"`);
			}
			if (isWin) {
				cmds.push(`move "${appTmpFolder}"\\* "${appFolder}"`);
			} else {
				cmds.push(
					`mv "${appTmpFolder}"/* "${appFolder}"`,
					`chmod 555 "${appFolder}"/*`
				);
			}
		}

		if (appTmpFolderFileCount) {
			cmds.push(
				`"${serviceFilePath}" --install`,
				`"${serviceFilePath}" --start`
			);
		}

		const scriptFilePath = path.join(tmpFolder, 'setup' + (isWin ? '.bat' : '.sh'));
		const scriptContent = cmds.join(' && ');
		fs.writeFileSync(scriptFilePath, scriptContent, { encoding: 'utf-8', mode: 0o777 });
		logger.info(`scriptFilePath : ${scriptFilePath}`)
		logger.info(`scriptContent : ${scriptContent}`)
		await sudoExec(scriptFilePath);
	} */

	fs.rmdirSync(tmpFolder, { recursive: true });
}
