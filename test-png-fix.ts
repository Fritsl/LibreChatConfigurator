import { promises as fs } from 'fs';
import express from 'express';
import path from 'path';
import { nanoid } from 'nanoid';

const PORT = 3002;

interface StoredFile {
  id: string;
  userId: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
}

const files = new Map<string, StoredFile>();
const storageDir = '/tmp/test-png-files';

async function storeFile(userId: string, filename: string, content: Buffer, mimeType: string): Promise<StoredFile> {
  const fileId = nanoid(21);
  const userDir = path.join(storageDir, userId);
  await fs.mkdir(userDir, { recursive: true });

  const filePath = path.join(userDir, fileId);
  await fs.writeFile(filePath, content);

  const storedFile: StoredFile = {
    id: fileId,
    userId,
    filename,
    mimeType,
    size: content.length,
    path: filePath
  };

  files.set(fileId, storedFile);
  console.log(`✓ Stored file: ${filename} (${content.length} bytes) with ID: ${fileId}`);
  return storedFile;
}

async function createTestPNG(): Promise<Buffer> {
  const width = 100;
  const height = 100;
  
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    
    Buffer.from([0, 0, 0, 13]),
    Buffer.from('IHDR'),
    Buffer.from([
      (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff,
      (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff,
      8, 2, 0, 0, 0
    ]),
    Buffer.from([182, 119, 134, 93]),
    
    Buffer.from([0, 0, 0, 12]),
    Buffer.from('IDAT'),
    Buffer.from([8, 29, 1, 1, 0, 254, 255, 0, 0, 0, 2, 0, 1]),
    Buffer.from([230, 33, 188, 51]),
    
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    Buffer.from([174, 66, 96, 130])
  ]);
  
  console.log(`✓ Created test PNG (${png.length} bytes)`);
  return png;
}

async function main() {
  console.log('\n🧪 Testing PNG Binary Data Fix\n');
  console.log('================================\n');
  
  await fs.mkdir(storageDir, { recursive: true });
  
  const testPNG = await createTestPNG();
  const stored = await storeFile('test-user', 'test.png', testPNG, 'image/png');
  
  const app = express();
  
  app.get('/files/:fileId', async (req, res) => {
    const { fileId } = req.params;
    const userId = req.query.userId as string;
    
    const file = files.get(fileId);
    
    if (!file || file.userId !== userId) {
      return res.status(404).send('File not found');
    }
    
    const content = await fs.readFile(file.path);
    
    console.log(`\n📤 Serving file: ${file.filename} (${content.length} bytes)`);
    console.log(`   First 8 bytes: ${Array.from(content.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.end(content);
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    const testUrl = `http://localhost:${PORT}/files/${stored.id}?userId=test-user`;
    console.log(`\n✅ Test server running on port ${PORT}\n`);
    console.log(`📸 Test this URL in your browser:\n`);
    console.log(`   ${testUrl}\n`);
    console.log(`Expected: A tiny 100x100 pixel white PNG image`);
    console.log(`If corrupted: Browser will show "image contains errors"\n`);
  });
}

main().catch(console.error);
