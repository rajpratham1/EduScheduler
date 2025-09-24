import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Undo,
  Redo,
  Save,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modifications?: ScheduleModification[];
  status?: 'pending' | 'applied' | 'failed';
}

interface ScheduleModification {
  id: string;
  type: 'move' | 'cancel' | 'add' | 'update';
  description: string;
  originalData?: any;
  newData?: any;
  affected: string[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastModified: Date;
}

const AIScheduleModifier: React.FC = () => {
  const { t } = useLanguage();
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [undoStack, setUndoStack] = useState<ScheduleModification[]>([]);
  const [redoStack, setRedoStack] = useState<ScheduleModification[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatSessions();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSessions = async () => {
    try {
      const response = await fetch('/api/chat-sessions');
      const sessions = await response.json();
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Timetable Modification',
      messages: [],
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setCurrentMessage('');
  };

  const loadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      try {
        await fetch(`/api/chat-sessions/${sessionId}`, { method: 'DELETE' });
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() && !uploadedFile) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', currentMessage);
      formData.append('sessionId', currentSessionId || '');
      
      if (uploadedFile) {
        formData.append('file', uploadedFile);
        setUploadedFile(null);
        setShowFileUpload(false);
      }

      const response = await fetch('/api/ai-schedule-modify', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: generateId(),
          type: 'assistant',
          content: result.response,
          timestamp: new Date(),
          modifications: result.modifications,
          status: 'pending'
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Auto-save session
        await saveCurrentSession();
      } else {
        throw new Error(result.error || 'Failed to process request');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
        status: 'failed'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyModifications = async (messageId: string, modifications: ScheduleModification[]) => {
    try {
      const response = await fetch('/api/apply-modifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'applied' as const }
            : msg
        ));
        
        // Add to undo stack
        setUndoStack(prev => [...prev, ...modifications]);
        setRedoStack([]); // Clear redo stack
        
        await saveCurrentSession();
      } else {
        throw new Error('Failed to apply modifications');
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  };

  const undoLastModification = async () => {
    if (undoStack.length === 0) return;

    const lastModification = undoStack[undoStack.length - 1];
    
    try {
      const response = await fetch('/api/undo-modification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modification: lastModification })
      });

      if (response.ok) {
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, lastModification]);
      }
    } catch (error) {
      console.error('Error undoing modification:', error);
    }
  };

  const redoLastModification = async () => {
    if (redoStack.length === 0) return;

    const lastUndone = redoStack[redoStack.length - 1];
    
    try {
      const response = await fetch('/api/apply-modifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications: [lastUndone] })
      });

      if (response.ok) {
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, lastUndone]);
      }
    } catch (error) {
      console.error('Error redoing modification:', error);
    }
  };

  const saveCurrentSession = async () => {
    if (!currentSessionId) return;

    const session = chatSessions.find(s => s.id === currentSessionId);
    if (session) {
      const updatedSession = {
        ...session,
        messages,
        lastModified: new Date()
      };

      try {
        await fetch(`/api/chat-sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSession)
        });

        setChatSessions(prev => prev.map(s => 
          s.id === currentSessionId ? updatedSession : s
        ));
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
      } else {
        alert('Please upload a CSV, Excel, or JSON file.');
      }
    }
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          AI Timetable Modifier
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={undoLastModification}
            disabled={undoStack.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Undo className="h-4 w-4" />
            <span>Undo</span>
          </button>
          <button
            onClick={redoLastModification}
            disabled={redoStack.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Redo className="h-4 w-4" />
            <span>Redo</span>
          </button>
          <button
            onClick={createNewSession}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Sessions Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Chat Sessions
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(session.lastModified)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Assistant
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <button
                    onClick={saveCurrentSession}
                    className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            {showFileUpload && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Choose File</span>
                  </button>
                  {uploadedFile && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <FileText className="h-4 w-4" />
                      <span>{uploadedFile.name}</span>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Ask me to modify your timetable using natural language. For example:
                    "Move John's math class from Monday 9 AM to Tuesday 10 AM"
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'system'
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Modifications Preview */}
                        {message.modifications && message.modifications.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="font-semibold text-sm">Proposed Changes:</h4>
                            {message.modifications.map((mod) => (
                              <div
                                key={mod.id}
                                className="bg-white dark:bg-gray-800 rounded p-3 text-sm"
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    mod.type === 'move' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    mod.type === 'cancel' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                    mod.type === 'add' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}>
                                    {mod.type.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300">{mod.description}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Affects: {mod.affected.join(', ')}
                                </p>
                              </div>
                            ))}
                            
                            {message.status === 'pending' && (
                              <div className="flex space-x-2 mt-3">
                                <button
                                  onClick={() => applyModifications(message.id, message.modifications!)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Apply Changes</span>
                                </button>
                                <button className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors">
                                  <XCircle className="h-3 w-3" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Status Indicator */}
                      {message.status && (
                        <div className="ml-2 flex-shrink-0">
                          {message.status === 'pending' && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          {message.status === 'applied' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {message.status === 'failed' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs opacity-70 mt-2">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-gray-600 dark:text-gray-300">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Describe the changes you want to make to the timetable..."
                  className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!currentMessage.trim() && !uploadedFile)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => setCurrentMessage("Cancel all classes on Friday afternoon")}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel Friday afternoon
                </button>
                <button
                  onClick={() => setCurrentMessage("Move all Monday morning classes to start 30 minutes later")}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Delay Monday morning
                </button>
                <button
                  onClick={() => setCurrentMessage("Show me all conflicts in the current schedule")}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Find conflicts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How to use AI Timetable Modifier
            </h4>
            <div className="text-blue-800 dark:text-blue-200 space-y-2">
              <p><strong>Natural Language Commands:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>"Move John's math class from Monday 9 AM to Tuesday 10 AM"</li>
                <li>"Cancel all Friday afternoon classes"</li>
                <li>"Add a new physics lab session on Wednesday at 2 PM in Lab 201"</li>
                <li>"Swap the timing of chemistry and biology classes on Thursday"</li>
                <li>"Find all scheduling conflicts for next week"</li>
              </ul>
              <p className="mt-3"><strong>File Upload:</strong> Upload CSV, Excel, or JSON files with schedule data for bulk modifications.</p>
              <p><strong>Safety:</strong> All changes are previewed before application. Use Undo/Redo for easy reversal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIScheduleModifier;