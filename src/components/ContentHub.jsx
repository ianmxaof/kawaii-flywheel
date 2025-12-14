import React, { useState } from 'react';
import { Image, Layers, FolderKanban, FileText, Sparkles, Youtube, Video } from 'lucide-react';
import ImageGallery from './Gallery/ImageGallery';
import ThumbnailCanvas from './Workshop/ThumbnailCanvas';
import TextEditor from './Workshop/TextEditor';
import LayerPanel from './Workshop/LayerPanel';
import ExportPanel from './Workshop/ExportPanel';
import ProjectManager from './Production/ProjectManager';
import ScriptEditor from './Production/ScriptEditor';
import MetadataForm from './Production/MetadataForm';
import BatchMetadata from './Production/BatchMetadata';
import ThumbnailAnalyzer from './Optimizer/ThumbnailAnalyzer';
import PromptLibrary from './Optimizer/PromptLibrary';
import TitleGenerator from './Optimizer/TitleGenerator';
import ContentAtomizer from './Optimizer/ContentAtomizer';
import YouTubeAuth from './YouTube/YouTubeAuth';
import Uploader from './YouTube/Uploader';
import AnalyticsDash from './YouTube/AnalyticsDash';
import VideoFactorySystem from './VideoFactory/VideoFactorySystem';
import IntegratedContentFactory from './IntegratedContentFactory';
import { useProjects } from '../hooks/useProjects';
import { useCanvas } from '../hooks/useCanvas';

const ContentHub = () => {
  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedProject, setSelectedProject] = useState(null);
  const { projects, updateProject, createProject } = useProjects();
  const canvas = useCanvas();
  const canvasRef = React.useRef(null);

  const tabs = [
    { id: 'gallery', icon: Image, label: 'Gallery' },
    { id: 'workshop', icon: Layers, label: 'Workshop' },
    { id: 'projects', icon: FolderKanban, label: 'Projects' },
    { id: 'scripts', icon: FileText, label: 'Scripts' },
    { id: 'optimizer', icon: Sparkles, label: 'Optimizer' },
    { id: 'videoFactory', icon: Video, label: 'Video Factory' },
    { id: 'integratedFactory', icon: Sparkles, label: 'Integrated Factory' },
    { id: 'youtube', icon: Youtube, label: 'YouTube' },
  ];

  function handleProjectSelect(project) {
    setSelectedProject(project);
    setActiveTab('scripts');
  }

  function handleProjectUpdate(updates) {
    if (selectedProject) {
      updateProject(selectedProject.id, updates);
      setSelectedProject({ ...selectedProject, ...updates });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 p-4 md:p-8" style={{ height: '1375px' }}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-pink-500 p-4 md:p-8 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2">
            ⚡ ANIME AUTOMATION FACTORY ⚡
          </h1>
          <p className="text-pink-300 mb-6">Your unfair advantage for viral introverts content</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/40'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'gallery' && (
              <div className="space-y-4">
                <ImageGallery />
              </div>
            )}

            {activeTab === 'workshop' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <ThumbnailCanvas
                      canvasRef={canvasRef}
                      onImageAdd={(image) => {
                        canvas.addLayer({
                          type: 'image',
                          ...image,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <LayerPanel
                      layers={canvas.layers}
                      selectedLayerId={canvas.selectedLayerId}
                      onSelectLayer={canvas.setSelectedLayerId}
                      onBringForward={canvas.bringForward}
                      onSendBackward={canvas.sendBackward}
                      onDeleteLayer={canvas.deleteLayer}
                    />
                    <TextEditor
                      layers={canvas.layers}
                      selectedLayer={canvas.selectedLayer}
                      onAddText={(textData) => canvas.addLayer({ type: 'text', ...textData })}
                      onUpdateText={canvas.updateLayer}
                    />
                    <ExportPanel
                      canvasRef={canvasRef}
                      layers={canvas.layers}
                      onSaveLayout={(layout) => {
                        const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `layout_${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      onLoadLayout={(layout) => {
                        // Load layout logic would go here
                        console.log('Load layout:', layout);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <ProjectManager onSelectProject={handleProjectSelect} />
            )}

            {activeTab === 'scripts' && (
              <div className="space-y-4">
                {selectedProject ? (
                  <>
                    <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4 mb-4">
                      <p className="text-pink-300 font-bold">
                        Editing: {selectedProject.title}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ScriptEditor
                        project={selectedProject}
                        onUpdate={handleProjectUpdate}
                      />
                      <MetadataForm
                        project={selectedProject}
                        onUpdate={handleProjectUpdate}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-pink-300/50 py-12">
                    <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select a project from the Projects tab to edit scripts and metadata</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'optimizer' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ThumbnailAnalyzer />
                  <PromptLibrary />
                </div>
                <TitleGenerator />
                <ContentAtomizer />
                <BatchMetadata />
              </div>
            )}

            {activeTab === 'videoFactory' && (
              <VideoFactorySystem 
                createProject={createProject}
                projects={projects}
              />
            )}

            {activeTab === 'integratedFactory' && (
              <IntegratedContentFactory 
                createProject={createProject}
                projects={projects}
              />
            )}

            {activeTab === 'youtube' && (
              <div className="space-y-6">
                <YouTubeAuth />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Uploader projects={projects} />
                  <AnalyticsDash />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentHub;
