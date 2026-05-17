import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Tutorial, TutorialFolder } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Folders ────────────────────────────────────────────────────────────────

export async function getFolders(req, res) {
  try {
    const folders = await TutorialFolder.find()
      .populate('created_by', 'name')
      .sort({ created_at: -1 })
      .lean();

    const result = await Promise.all(folders.map(async (f) => {
      const videoCount = await Tutorial.countDocuments({ folder_id: f._id });
      return {
        ...f,
        id: f._id.toString(),
        created_by_name: f.created_by?.name || 'Unknown',
        video_count: videoCount
      };
    }));

    res.json(result);
  } catch (error) {
    console.error('GET /api/tutorials/folders error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createFolder(req, res) {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    const folder = await TutorialFolder.create({
      name: name.trim(),
      created_by: req.user.id
    });
    res.status(201).json({ ...folder.toObject(), id: folder._id.toString() });
  } catch (error) {
    console.error('POST /api/tutorials/folders error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteFolder(req, res) {
  try {
    const folder = await TutorialFolder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const tutorials = await Tutorial.find({ folder_id: req.params.id });
    for (const tutorial of tutorials) {
      const fullPath = join(__dirname, '..', tutorial.file_path);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      await Tutorial.findByIdAndDelete(tutorial._id);
    }

    await TutorialFolder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/tutorials/folders/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

// ─── Tutorials ───────────────────────────────────────────────────────────────

export async function getTutorials(req, res) {
  try {
    const { folderId } = req.query;
    const filter = folderId ? { folder_id: folderId } : {};
    const tutorials = await Tutorial.find(filter)
      .populate('uploaded_by', 'name')
      .sort({ created_at: -1 })
      .lean();

    res.json(tutorials.map(t => ({
      ...t,
      id: t._id.toString(),
      uploaded_by_name: t.uploaded_by?.name || 'Unknown'
    })) || []);
  } catch (error) {
    console.error('GET /api/tutorials error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getTutorialById(req, res) {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({ error: 'Tutorial not found' });
    }
    res.json(tutorial);
  } catch (error) {
    console.error('GET /api/tutorials/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createTutorial(req, res) {
  try {
    const { title, folderId } = req.body;
    if (!title || !req.file) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Title and video file are required' });
    }
    if (!folderId) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'folderId is required' });
    }
    const folder = await TutorialFolder.findById(folderId);
    if (!folder) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Folder not found' });
    }

    const filePath = `/uploads/tutorials/${req.file.filename}`;
    const tutorial = await Tutorial.create({
      title,
      folder_id: folderId,
      filename: req.file.filename,
      file_path: filePath,
      file_size: req.file.size,
      uploaded_by: req.user.id
    });
    res.status(201).json({ ...tutorial.toObject(), id: tutorial._id.toString() });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('POST /api/tutorials error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteTutorial(req, res) {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({ error: 'Tutorial not found' });
    }
    const fullPath = join(__dirname, '..', tutorial.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    await Tutorial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tutorial deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/tutorials/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
