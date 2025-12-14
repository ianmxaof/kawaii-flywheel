import { useState } from 'react';
import { Plus, Edit, Trash2, FileText, Image as ImageIcon, Calendar, CheckCircle, Circle, Upload } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';

const STATUS_CONFIG = {
  draft: { label: 'Draft', icon: Circle, color: 'text-yellow-400' },
  ready: { label: 'Ready', icon: CheckCircle, color: 'text-green-400' },
  uploaded: { label: 'Uploaded', icon: Upload, color: 'text-blue-400' },
};

export default function ProjectManager({ onSelectProject }) {
  const { projects, createProject, updateProject, deleteProject, updateStatus } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  function handleCreate() {
    if (!newTitle.trim()) return;
    
    const project = createProject({ title: newTitle.trim() });
    setNewTitle('');
    setShowCreateModal(false);
    if (onSelectProject) {
      onSelectProject(project);
    }
  }

  function handleDelete(id) {
    if (confirm('Delete this project? This cannot be undone.')) {
      deleteProject(id);
    }
  }

  function handleStatusChange(id, newStatus) {
    updateStatus(id, newStatus);
  }

  const filteredProjects = filterStatus === 'all'
    ? projects
    : projects.filter(p => p.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Projects
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterStatus === 'all'
              ? 'bg-pink-500 text-white'
              : 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/40'
          }`}
        >
          All ({projects.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = projects.filter(p => p.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                filterStatus === status
                  ? 'bg-pink-500 text-white'
                  : 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/40'
              }`}
            >
              <config.icon size={14} />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center text-pink-300/50 py-12">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No projects yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => {
            const StatusIcon = STATUS_CONFIG[project.status].icon;
            const statusColor = STATUS_CONFIG[project.status].color;
            
            return (
              <div
                key={project.id}
                className="bg-black/40 border-2 border-pink-500/30 rounded-lg p-4 hover:border-pink-500/60 transition-all cursor-pointer"
                onClick={() => onSelectProject && onSelectProject(project)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-pink-300 font-bold text-lg flex-1">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <StatusIcon size={18} className={statusColor} />
                    <select
                      value={project.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(project.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`bg-black/50 border border-pink-500 rounded px-2 py-1 text-xs ${statusColor}`}
                    >
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <option key={status} value={status}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-pink-300/70">
                    <ImageIcon size={14} />
                    <span>{project.thumbnail ? 'Thumbnail set' : 'No thumbnail'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-pink-300/70">
                    <FileText size={14} />
                    <span>{project.script ? `${project.script.length} chars` : 'No script'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-pink-300/70">
                    <Calendar size={14} />
                    <span>
                      {project.metadata?.scheduleTime
                        ? new Date(project.metadata.scheduleTime).toLocaleDateString()
                        : 'Not scheduled'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProject(project);
                    }}
                    className="flex-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black/90 border-2 border-pink-500 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-pink-300 font-bold text-xl mb-4">Create New Project</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Project title..."
              className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTitle('');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

