import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as SocketIO from "socket.io";


const INSTANCE_FILE_NAME = 'service-instance.json';

export class StatusEmitter {

    private readonly server = http.createServer();

    private readonly io = SocketIO(this.server, { serveClient: false });

    private readonly nsp = this.io.of('/status');

    constructor(private readonly dataFolder: string) {
        this.server.on('error', console.error);
        this.nsp.on('connection', _socket => {
            // TODO: Listen to events
        });
    }

    async start() {
        await new Promise<void>((resolve, reject) => {
            this.server.listen(0, 'localhost', () => {
                const { pid } = process;
                const port = this.server.address()['port'];
                try {
                    const instanceFilePath = path.join(this.dataFolder, INSTANCE_FILE_NAME);

                   

                    
                    fs.writeFileSync(instanceFilePath, JSON.stringify({ pid, port }, null, 4), { encoding: 'utf-8' , mode : 0o666 });

                   
                    //fs.chmodSync(instanceFilePath, fs.constants.S_IRUSR | fs.constants.S_IWUSR | fs.constants.S_IRGRP | fs.constants.S_IROTH);
                } catch (error) {
                    console.log(error)
                    return reject(error);
                }
                console.log('Listening for status requests on port', port);
                resolve();
            });
        });
    }

    emit(event: string, ...args: any[]) {
        return this.nsp.emit(event, ...args);
    }

    async stop() {
        await new Promise<void>((resolve, reject) => this.server.close(error => error ? reject(error) : resolve()));
        fs.unlinkSync(path.join(this.dataFolder, INSTANCE_FILE_NAME));
    }
}
