import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

async function getGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

async function createFolder(drive: any, name: string, parentId?: string) {
  const fileMetadata: any = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name, webViewLink'
  });

  return response.data;
}

async function uploadFile(drive: any, filePath: string, fileName: string, parentId: string) {
  const fileContent = await readFile(filePath);
  
  const fileMetadata = {
    name: fileName,
    parents: [parentId]
  };

  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath)
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink'
  });

  return response.data;
}

async function uploadDirectory(drive: any, dirPath: string, parentId: string, rootPath: string) {
  const items = await readdir(dirPath);
  let uploadedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.relative(rootPath, fullPath);
    
    // Skip common directories that shouldn't be uploaded
    if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.replit' || item === '.cache') {
      console.log(`⏭️  Skipping: ${relativePath}`);
      skippedCount++;
      continue;
    }

    const itemStat = await stat(fullPath);

    if (itemStat.isDirectory()) {
      console.log(`📁 Creating folder: ${relativePath}`);
      const folder = await createFolder(drive, item, parentId);
      const result = await uploadDirectory(drive, fullPath, folder.id, rootPath);
      uploadedCount += result.uploaded;
      skippedCount += result.skipped;
    } else {
      // Skip very large files (> 100MB)
      if (itemStat.size > 100 * 1024 * 1024) {
        console.log(`⏭️  Skipping large file: ${relativePath} (${(itemStat.size / 1024 / 1024).toFixed(2)} MB)`);
        skippedCount++;
        continue;
      }

      console.log(`📄 Uploading: ${relativePath} (${(itemStat.size / 1024).toFixed(2)} KB)`);
      try {
        await uploadFile(drive, fullPath, item, parentId);
        uploadedCount++;
      } catch (error) {
        console.error(`❌ Error uploading ${relativePath}:`, error);
        skippedCount++;
      }
    }
  }

  return { uploaded: uploadedCount, skipped: skippedCount };
}

async function main() {
  console.log('🚀 Cable Uno Play - Subida a Google Drive\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    console.log('🔐 Conectando a Google Drive...');
    const drive = await getGoogleDriveClient();
    console.log('✅ Conectado exitosamente\n');

    console.log('📁 Creando carpeta principal...');
    const projectFolder = await createFolder(drive, 'Cable Uno Play - Backup');
    console.log(`✅ Carpeta creada: ${projectFolder.name}`);
    console.log(`🔗 Link: ${projectFolder.webViewLink}\n`);

    console.log('📦 Subiendo archivos del proyecto...\n');
    const startTime = Date.now();
    
    const projectRoot = process.cwd();
    const result = await uploadDirectory(drive, projectRoot, projectFolder.id, projectRoot);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ ¡COMPLETADO!');
    console.log('═══════════════════════════════════════════');
    console.log(`📊 Estadísticas:`);
    console.log(`   • Archivos subidos: ${result.uploaded}`);
    console.log(`   • Archivos omitidos: ${result.skipped}`);
    console.log(`   • Tiempo total: ${duration}s`);
    console.log(`\n🔗 Ver en Google Drive:`);
    console.log(`   ${projectFolder.webViewLink}`);
    console.log('\n💾 Tu proyecto está respaldado en Google Drive');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
