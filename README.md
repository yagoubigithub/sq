smart-Q Communicator
====================

## Description

This project is a multiplatform desktop application based on [Angular](https://angular.io) and [Electron.js](https://electronjs.org). Windows, MacOS and Linux are supported.

The project package is composed by different sub-packages:

- core: a library package created in TypeScript, this package is used by the ui and service packages.
- ui: the main Electron app, an Angular-based project.
- service: a NodeJs app, installed as a background service on the end-user's PC.

## Installation

```bash
$ npm i
# will install all sub-packages: core, service and ui, successively
```

## Build

The core, ui and service packages all have a build script. 

```
$ npm run build
```

## Running

The ui and service packages have a start script.

```bash
$ npm run start

```

## Release build

To build the service's executable file:

```bash
# Windows version
service$ npm run package:windows

# MacOS version
service$ npm run package:macos

# Linux version
service$ npm run package:linux
```

Then zip the executable file with its dependencies, and upload to https://smart-q.de/update/sq-communicator/{platformName}.

To build the installer file:

```bash
# Windows version
ui$ npm run electron:windows

# MacOS version
ui$ npm run electron:macos

# Linux version
ui$ npm run electron:linux
```

Then upload the installer file to https://smart-q.de/update/sq-communicator/{platformName}.

## Runtime

During the first start of the app, the service executable file is downloaded and set up so that it is automatically launched on system startup. The location of the executable file vary depending on the OS:

- Windows: The folder path of `%ComSpec%` (usually `C:\Windows\System32\sq-service.exe`)
- MacOS and Linux: `/etc/sq-communicator`

At runtime, both the app and the service share the same configuration and database, the location of the data folder vary depending on the OS:

- Windows: `%ALLUSERSPROFILE%\sq-communicator` (usually `C:\ProgramData\sq-communicator`)
- MacOS and Linux: `/var/lib/sq-communicator`
