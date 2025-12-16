import { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'ProjectLibrary';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

/**
 * Hook for managing persistent project storage with IndexedDB and filesystem
 */
export function useProjectPersistence() {
  const [db, setDb] = useState(null);
  const [projects, setProjects] = useState([]);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
              store.createIndex('name', 'name', { unique: false });
              store.createIndex('created', 'created', { unique: false });
              store.createIndex('updated', 'updated', { unique: false });
            }
          },
        });
        setDb(database);
        await loadProjects();
      } catch (error) {
        console.error('Failed to initialize project database:', error);
      }
    };

    initDB();
  }, []);

  // Load all projects
  const loadProjects = useCallback(async () => {
    if (!db) return;

    try {
      const allProjects = await db.getAll(STORE_NAME);
      setProjects(allProjects.sort((a, b) => (b.updated || b.created) - (a.updated || a.created)));
      return allProjects;
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }, [db]);

  /**
   * Save project to IndexedDB and optionally to filesystem
   */
  const saveProject = useCallback(async (projectData, saveToFileSystem = false) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const project = {
        id: projectData.id || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: projectData.name || 'Untitled Project',
        created: projectData.created || Date.now(),
        updated: Date.now(),
        data: projectData
      };

      // Save to IndexedDB
      await db.put(STORE_NAME, project);
      await loadProjects();

      // Optionally save to filesystem
      if (saveToFileSystem && window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`,
            types: [{
              description: 'Project File',
              accept: { 'application/json': ['.json'] }
            }]
          });

          const writable = await handle.createWritable();
          await writable.write(JSON.stringify(project, null, 2));
          await writable.close();

          console.log(`✅ Project saved to filesystem: ${project.name}`);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Failed to save to filesystem:', error);
          }
        }
      }

      return project;
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }, [db, loadProjects]);

  /**
   * Load project from IndexedDB
   */
  const loadProject = useCallback(async (projectId) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const project = await db.get(STORE_NAME, projectId);
      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }, [db]);

  /**
   * Load project from filesystem
   */
  const loadProjectFromFile = useCallback(async () => {
    if (!window.showOpenFilePicker) {
      throw new Error('File System Access API not supported');
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Project File',
          accept: { 'application/json': ['.json'] }
        }]
      });

      const file = await handle.getFile();
      const text = await file.text();
      const project = JSON.parse(text);

      // Also save to IndexedDB for quick access
      if (db) {
        await saveProject(project.data || project, false);
      }

      return project;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load project from file:', error);
      }
      throw error;
    }
  }, [db, saveProject]);

  /**
   * Delete project
   */
  const deleteProject = useCallback(async (projectId) => {
    if (!db) throw new Error('Database not initialized');

    try {
      await db.delete(STORE_NAME, projectId);
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }, [db, loadProjects]);

  /**
   * Export project as JSON file
   */
  const exportProject = useCallback(async (projectId) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const project = await db.get(STORE_NAME, projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const json = JSON.stringify(project, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export project:', error);
      throw error;
    }
  }, [db]);

  /**
   * Get project by name
   */
  const getProjectByName = useCallback(async (name) => {
    if (!db) return null;

    try {
      const index = db.transaction(STORE_NAME).store.index('name');
      const projects = await index.getAll(name);
      return projects.length > 0 ? projects[0] : null;
    } catch (error) {
      console.error('Failed to get project by name:', error);
      return null;
    }
  }, [db]);

  /**
   * Auto-save current pipeline state
   */
  const autoSave = useCallback(async (pipelineData, projectName) => {
    if (!db) return;

    try {
      const project = {
        name: projectName || 'Auto-saved Project',
        data: pipelineData,
        autoSaved: true
      };

      await saveProject(project, false);
      console.log('✅ Auto-saved project');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [saveProject, db]);

  return {
    db,
    projects,
    saveProject,
    loadProject,
    loadProjectFromFile,
    deleteProject,
    exportProject,
    getProjectByName,
    autoSave,
    loadProjects
  };
}

export default useProjectPersistence;
