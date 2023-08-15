import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as Splashscreen from "@trodi/electron-splashscreen";
import { setupEnvironment } from './setup';


let win: BrowserWindow = null;
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');
const openDevTools = serve || args.some(val => val === '--open-dev-tools');

let showExitPrompt = false; // TODO: Show only when a form is visible, move to core.service.ts

function createWindow(): BrowserWindow {

	const mainOpts: Electron.BrowserWindowConstructorOptions = {
		width: 1200,
		height: 768,
		center: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
			allowRunningInsecureContent: (serve) ? true : false
		}
	};

	const config: Splashscreen.Config = {
		windowOpts: mainOpts,
		templateUrl: `${__dirname}/splash-screen.html`,
		splashScreenOpts: {
			width: 669,
			height: 404
		},
		minVisible: 5000
	};

	if (serve) {
		config.delay = 0;
	}

	// Create the browser window.
	let win: BrowserWindow = Splashscreen.initSplashScreen(config);

	//win.setMenu(null);

	setupEnvironment()
	.then(() => {
		if (serve) {
			require('electron-reload')(__dirname, {
				electron: require(`${__dirname}/node_modules/electron`)
			});
			win.loadURL('http://localhost:4200');
		} else {
			showExitPrompt = true;
			win.loadURL(url.format({
				pathname: path.join(__dirname, 'dist/index.html'),
				protocol: 'file:',
				slashes: true
			}));
		}
	}).catch(error => {
		dialog.showErrorBox('Setup error', error.message);
		app.quit();
	});

	if (openDevTools) {
		win.webContents.openDevTools({ mode: 'detach' });
	}

	win.on('close', async (event) => {
		if (showExitPrompt) {
			event.preventDefault() // Prevents the window from closing
			const { response } = await dialog.showMessageBox(win, {
				type: 'question',
				buttons: ['Nein', 'Ja'],
				title: 'Confirm',
				message: 'Sind Sie sicher?'
			});
			if (response === 1) { // Runs the following if 'Yes' is clicked
				showExitPrompt = false;
				win.close();
			}
		}
	})

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store window
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null;
	});

	return win;
}

try {

	const gotTheLock = app.requestSingleInstanceLock();

	if (!gotTheLock) {
		app.quit();
	} else {
		app.allowRendererProcessReuse = true;

		app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
			// Someone tried to run a second instance, we should focus our window.
			if (win) {
				if (win.isMinimized()) {
					win.restore();
				}
				win.focus();
			}
		});

		// This method will be called when Electron has finished
		// initialization and is ready to create browser windows.
		// Some APIs can only be used after this event occurs.
		// Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
		app.on('ready', () => setTimeout(createWindow, 400));

		// Quit when all windows are closed.
		app.on('window-all-closed', () => {
			app.quit();
		});
	}
} catch (e) {
	// Catch Error
	// throw e;
}
