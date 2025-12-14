import { useState, useEffect } from 'react';

const STORAGE_KEY = 'contentFactory_projects';

export function useProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);

  function loadProjects() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  function saveProjects(newProjects) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
      setProjects(newProjects);
    } catch (error) {
      console.error('Failed to save projects:', error);
      throw error;
    }
  }

  function createProject(projectData) {
    const newProject = {
      id: Date.now(),
      title: projectData.title || 'Untitled Project',
      status: 'draft',
      thumbnail: null,
      script: '',
      metadata: {
        title: '',
        description: '',
        tags: [],
        scheduleTime: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...projectData,
    };
    
    const updated = [...projects, newProject];
    saveProjects(updated);
    return newProject;
  }

  function updateProject(id, updates) {
    const updated = projects.map(project =>
      project.id === id
        ? { ...project, ...updates, updatedAt: new Date().toISOString() }
        : project
    );
    saveProjects(updated);
    return updated.find(p => p.id === id);
  }

  function deleteProject(id) {
    const updated = projects.filter(p => p.id !== id);
    saveProjects(updated);
  }

  function getProject(id) {
    return projects.find(p => p.id === id);
  }

  function updateStatus(id, status) {
    if (!['draft', 'ready', 'uploaded'].includes(status)) {
      throw new Error('Invalid status');
    }
    return updateProject(id, { status });
  }

  return {
    projects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    updateStatus,
    refresh: loadProjects,
  };
}

