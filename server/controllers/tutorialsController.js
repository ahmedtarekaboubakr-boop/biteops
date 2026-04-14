import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Tutorial } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getTutorials(req, res) {
  try {
    const tutorials = await Tutorial.find().sort({ created_at: -1 });
    res.json(tutorials || []);
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
    const { title, description } = req.body;
    if (!title || !req.file) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Title and video file are required' });
    }
    const filePath = `/uploads/tutorials/${req.file.filename}`;
    const tutorial = await Tutorial.create({
      title,
      description: description || '',
      filename: req.file.filename,
      file_path: filePath,
      file_size: req.file.size,
      uploaded_by: req.user.id
    });
    res.status(201).json(tutorial);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    await Tutorial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tutorial deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/tutorials/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
