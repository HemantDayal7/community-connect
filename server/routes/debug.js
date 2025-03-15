import express from 'express';
import upload from '../middleware/fileUpload.js';
import path from 'path';
import fs from 'fs';
import Resource from '../models/Resource.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

router.post('/test-upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Instead of using req.file.path, build a relative path for DB
    const relativePath = "uploads/" + req.file.filename;
    const fileUrl = `http://localhost:5050/${relativePath}`;
    
    console.log(`✅ Test upload successful: ${relativePath}`);
    
    // Check if file is accessible
    fs.access(req.file.path, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`❌ File not accessible: ${req.file.path}`);
        return res.status(500).json({ 
          message: 'File saved but not accessible', 
          file: req.file,
          error: err.message 
        });
      }
      
      res.status(200).json({
        message: 'File uploaded successfully',
        file: req.file,
        dbPath: relativePath,      // Store this in your DB
        url: fileUrl,              // For direct access
        accessPath: req.file.path
      });
    });
  } catch (error) {
    console.error(`❌ Error in test upload: ${error.message}`);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Add a route to check resource image paths
router.get('/check-image-paths', async (req, res) => {
  try {
    const resources = await Resource.find({ image: { $ne: null } }).limit(10);
    const pathData = resources.map(r => ({
      id: r._id,
      title: r.title,
      imagePath: r.image,
      computedUrl: r.image.startsWith('http') ? 
        r.image : 
        `http://localhost:5050/${r.image.replace(/^\/+/, '').replace(/uploads\/uploads\//, 'uploads/')}`
    }));
    
    res.status(200).json({
      message: 'Resource image paths',
      count: pathData.length,
      paths: pathData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking image paths', error: error.message });
  }
});

// Route to check image paths and if files exist
router.get('/check-images', async (req, res) => {
  try {
    const resources = await Resource.find({ image: { $exists: true, $ne: null } }).limit(10);
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Check if uploads directory exists
    let uploadsExists = false;
    try {
      uploadsExists = fs.existsSync(uploadsDir);
    } catch (err) {
      console.error("Error checking uploads directory:", err);
    }
    
    const results = resources.map(resource => {
      // Original path
      let originalPath = resource.image;
      
      // Clean path (remove leading slashes)
      let cleanPath = originalPath.replace(/^\/+/, "");
      
      // Fix duplicate uploads path
      cleanPath = cleanPath.replace(/uploads\/uploads\//g, "uploads/");
      
      // If path doesn't start with "uploads/", add it
      if (!cleanPath.startsWith("uploads/")) {
        cleanPath = `uploads/${cleanPath}`;
      }
      
      // Full file system path
      const fullPath = path.join(process.cwd(), cleanPath);
      
      // Check if file exists
      let fileExists = false;
      try {
        fileExists = fs.existsSync(fullPath);
      } catch (err) {
        console.error(`Error checking if file exists at ${fullPath}:`, err);
      }
      
      // Expected URL
      const expectedUrl = `http://localhost:5050/${cleanPath}`;
      
      return {
        resourceId: resource._id,
        title: resource.title,
        originalPath: originalPath,
        cleanPath: cleanPath,
        fullPath: fullPath,
        fileExists: fileExists,
        expectedUrl: expectedUrl
      };
    });
    
    res.json({
      uploadsDirectoryExists: uploadsExists,
      uploadsDirectoryPath: uploadsDir,
      resources: results
    });
  } catch (error) {
    console.error("Error in check-images:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check if files actually exist in uploads folder
router.get('/files', (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Check if directory exists
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({
        error: 'Uploads directory not found',
        path: uploadsDir
      });
    }
    
    // Read files in directory
    const files = fs.readdirSync(uploadsDir);
    
    // Get details for each file
    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        size: stats.size,
        created: stats.birthtime,
        url: `http://localhost:5050/uploads/${filename}`,
        directLink: `<a href="http://localhost:5050/uploads/${filename}" target="_blank">${filename}</a>`
      };
    });
    
    // Return HTML response for easier debugging
    const html = `
      <html>
        <head>
          <title>Files in Uploads Directory</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Files in Uploads Directory (${files.length})</h1>
          <p>Directory path: ${uploadsDir}</p>
          <table>
            <tr>
              <th>Filename</th>
              <th>Size</th>
              <th>Created</th>
              <th>Direct Link</th>
            </tr>
            ${fileDetails.map(file => `
              <tr>
                <td>${file.name}</td>
                <td>${Math.round(file.size / 1024)} KB</td>
                <td>${new Date(file.created).toLocaleString()}</td>
                <td>${file.directLink}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Route to show all files in uploads folder and check if they match database references
router.get('/uploads-check', async (req, res) => {
  try {
    // Get files from uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let files = [];
    let dirExists = false;
    
    try {
      files = fs.readdirSync(uploadsDir);
      dirExists = true;
    } catch (err) {
      console.error('Error reading uploads directory:', err);
    }
    
    // Get resources with images from database
    const resources = await Resource.find({ image: { $exists: true, $ne: null } }).limit(20);
    
    // Check if files referenced in database exist on disk
    const resourceChecks = resources.map(resource => {
      // Extract just the filename regardless of path
      let filename;
      if (resource.image.includes('/')) {
        filename = resource.image.split('/').pop();
      } else {
        filename = resource.image;
      }
      
      const fileExists = files.includes(filename);
      
      return {
        resourceId: resource._id,
        title: resource.title,
        dbImagePath: resource.image,
        filename,
        fileExists,
        url: `http://localhost:5050/uploads/${filename}`
      };
    });
    
    // Return HTML for easier viewing
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Uploads Diagnostic</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            .missing { background-color: #ffcccc; }
            .exists { background-color: #ccffcc; }
            .image-preview { max-width: 100px; max-height: 60px; }
          </style>
        </head>
        <body>
          <h1>Uploads Directory Diagnostic</h1>
          
          <h2>Directory Status</h2>
          <p>Directory path: ${uploadsDir}</p>
          <p>Directory exists: ${dirExists ? 'Yes' : 'No'}</p>
          <p>File count: ${files.length}</p>
          
          <h2>Files on Disk (${files.length})</h2>
          <table>
            <tr>
              <th>Filename</th>
              <th>Preview</th>
            </tr>
            ${files.map(file => `
              <tr>
                <td><a href="/uploads/${file}" target="_blank">${file}</a></td>
                <td><img src="/uploads/${file}" class="image-preview" onerror="this.src='/placeholder.png'"></td>
              </tr>
            `).join('')}
          </table>
          
          <h2>Resources in Database (${resourceChecks.length})</h2>
          <table>
            <tr>
              <th>Resource Title</th>
              <th>DB Image Path</th>
              <th>Extracted Filename</th>
              <th>File Exists?</th>
              <th>Preview</th>
              <th>URL</th>
            </tr>
            ${resourceChecks.map(check => `
              <tr class="${check.fileExists ? 'exists' : 'missing'}">
                <td>${check.title}</td>
                <td>${check.dbImagePath}</td>
                <td>${check.filename}</td>
                <td>${check.fileExists ? 'Yes' : 'No'}</td>
                <td><img src="${check.url}" class="image-preview" onerror="this.src='/placeholder.png'"></td>
                <td><a href="${check.url}" target="_blank">${check.url}</a></td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add this route to your existing debug.js file

// Return just the file list as JSON (for test-image.html)
router.get('/files-json', (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Check if directory exists
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({
        error: 'Uploads directory not found',
        path: uploadsDir
      });
    }
    
    // Read files in directory
    const files = fs.readdirSync(uploadsDir);
    
    // Get details for each file
    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        size: stats.size,
        created: stats.birthtime,
        url: `/uploads/${filename}`
      };
    });
    
    res.json({
      count: files.length,
      directoryPath: uploadsDir,
      files: fileDetails
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Add this route to check what files exist in the uploads folder

router.get('/check-files', (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Check if directory exists
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({
        error: 'Uploads directory not found',
        path: uploadsDir
      });
    }
    
    // List all files in directory
    const files = fs.readdirSync(uploadsDir);
    
    // Return as JSON
    res.json({
      directory: uploadsDir,
      fileCount: files.length,
      files: files
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;

// Add this to your server.js:
// app.use('/debug', debugRoutes);