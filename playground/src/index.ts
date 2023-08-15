import { ICDDb } from '@sq-communicator/core';
import { ICDUtils } from "./icd-utils";

(async function() {
    const inputFile = process.argv[2];
    const outputFolderPath = process.cwd();

    const icdDb = new ICDDb(outputFolderPath);
    await icdDb.open();

    // await ICDUtils.updateICD(inputFile);
    // await ICDUtils.updateICDAlpha(inputFile);

    await icdDb.close();
})().catch(console.error);
