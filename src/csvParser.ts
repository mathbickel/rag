import fs from 'fs'
import path from 'path';

export type documentsData = {
    ids: string[],
    documents: string[]
}
export function getDocuments(): documentsData {
    const targetPaste = path.join(__dirname, '/mcu_data/archive');
    const allFilesAndFolders = fs.readdirSync(targetPaste);
    const csvFiles = allFilesAndFolders.filter(file => {
        const fullPath = path.join(targetPaste, file);
        const isFile = fs.statSync(fullPath).isFile();
        const isCsv = path.extname(file).toLowerCase() === '.csv';
        
        return isFile && isCsv;
    });

    const documents = csvFiles.map(f => fs.readFileSync(path.join(targetPaste, f), "utf-8"));
    const ids = csvFiles.map((_, i) => `id${i}`);
    
    return {
        ids,
        documents
    }
}