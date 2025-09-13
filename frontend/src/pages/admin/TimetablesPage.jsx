import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Modal from 'src/components/Modal'; // Import Modal component
import { useAuth } from 'src/contexts/AuthContext'; // Import useAuth
import './TimetablesPage.css'; // We will create this CSS file

const initialItems = [
  { id: 'item-1', content: 'Math Lecture' },
  { id: 'item-2', content: 'Physics Lab' },
  { id: 'item-3', content: 'Chemistry Tutorial' },
  { id: 'item-4', content: 'Biology Seminar' },
];

const initialColumns = {
  'column-1': {
    id: 'column-1',
    title: 'Available Items',
    itemIds: initialItems.map(item => item.id),
  },
  'monday-9am': {
    id: 'monday-9am',
    title: 'Monday 9:00 AM',
    itemIds: [],
  },
  'monday-10am': {
    id: 'monday-10am',
    title: 'Monday 10:00 AM',
    itemIds: [],
  },
  // Add more columns for days and times
};

function TimetablesPage() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState(initialItems);
  const [columns, setColumns] = useState(initialColumns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [timetableName, setTimetableName] = useState('');
  const [allTimetables, setAllTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);

  const fetchAllTimetables = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/timetables', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch timetables');
      const data = await response.json();
      setAllTimetables(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchAllTimetables();
    }
  }, [currentUser]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = columns[source.droppableId];
    const finish = columns[destination.droppableId];

    if (start === finish) {
      const newItemIds = Array.from(start.itemIds);
      newItemIds.splice(source.index, 1);
      newItemIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...start,
        itemIds: newItemIds,
      };
      setColumns({
        ...columns,
        [newColumn.id]: newColumn,
      });
      return;
    }

    // Moving from one list to another
    const startItemIds = Array.from(start.itemIds);
    startItemIds.splice(source.index, 1);
    const newStart = {
      ...start,
      itemIds: startItemIds,
    };

    const finishItemIds = Array.from(finish.itemIds);
    finishItemIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finish,
      itemIds: finishItemIds,
    };

    setColumns({
      ...columns,
      [newStart.id]: newStart,
      [newFinish.id]: newFinish,
    });
  };

  const handleSaveTimetable = async (e) => {
    e.preventDefault();
    if (!timetableName.trim()) {
      setError('Timetable name cannot be empty.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const timetableData = {
        name: timetableName,
        data: { items, columns }, // Store the DND state
      };

      let url = 'http://127.0.0.1:8000/api/v1/admin/timetables';
      let method = 'POST';

      if (selectedTimetableId) {
        url = `http://127.0.0.1:8000/api/v1/admin/timetables/${selectedTimetableId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(timetableData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save timetable');
      }
      alert('Timetable saved successfully!');
      setShowSaveModal(false);
      setTimetableName('');
      setSelectedTimetableId(null);
      fetchAllTimetables(); // Refresh list of timetables
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoadTimetable = async (timetableId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/admin/timetables/${timetableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load timetable');
      const data = await response.json();
      
      setItems(data.data.items);
      setColumns(data.data.columns);
      setTimetableName(data.name);
      setSelectedTimetableId(data.id);
      setShowLoadModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTimetable = async (timetableId) => {
    if (window.confirm('Are you sure you want to delete this timetable?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://127.0.0.1:8000/api/v1/admin/timetables/${timetableId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to delete timetable');
        alert('Timetable deleted successfully!');
        fetchAllTimetables(); // Refresh list
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleNewTimetable = () => {
    setItems(initialItems);
    setColumns(initialColumns);
    setTimetableName('');
    setSelectedTimetableId(null);
  };

  if (loading) return <div className="timetables-container">Loading...</div>;
  if (error) return <div className="timetables-container error">Error: {error}</div>;

  return (
    <div className="timetables-container">
      <h2>Manage Timetables</h2>
      {error && <div className="error">Error: {error}</div>}

      {currentUser && currentUser.role === 'admin' && (
        <div className="timetable-actions">
          <button onClick={() => setShowSaveModal(true)}>Save Timetable</button>
          <button onClick={() => setShowLoadModal(true)}>Load Timetable</button>
          <button onClick={handleNewTimetable}>New Timetable</button>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="dnd-container">
          {Object.values(columns).map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  className="column"
                  style={{
                    background: snapshot.isDraggingOver ? 'lightblue' : 'lightgrey',
                  }}
                  {...provided.droppableProps}
                >
                  <h3>{column.title}</h3>
                  {column.itemIds.map((itemId, index) => {
                    const item = items.find((i) => i.id === itemId);
                    if (!item) return null; // Handle case where item might not be found
                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="item"
                            style={{
                              backgroundColor: snapshot.isDragging ? '#263B4A' : '#456C86',
                              ...provided.draggableProps.style,
                            }}
                          >
                            {item.content}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Save Timetable Modal */}
      <Modal show={showSaveModal} onClose={() => setShowSaveModal(false)}>
        <form onSubmit={handleSaveTimetable}>
          <h3>{selectedTimetableId ? 'Update' : 'Save'} Timetable</h3>
          {error && <div className="error">Error: {error}</div>}
          <input 
            type="text" 
            value={timetableName} 
            onChange={e => setTimetableName(e.target.value)} 
            placeholder="Timetable Name" 
            required 
          />
          <button type="submit">{selectedTimetableId ? 'Update' : 'Save'}</button>
        </form>
      </Modal>

      {/* Load Timetable Modal */}
      <Modal show={showLoadModal} onClose={() => setShowLoadModal(false)}>
        <h3>Load Timetable</h3>
        {error && <div className="error">Error: {error}</div>}
        {allTimetables.length === 0 ? (
          <p>No saved timetables.</p>
        ) : (
          <table className="timetable-list-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allTimetables.map(tt => (
                <tr key={tt.id}>
                  <td>{tt.name}</td>
                  <td>
                    <button onClick={() => handleLoadTimetable(tt.id)}>Load</button>
                    <button onClick={() => handleDeleteTimetable(tt.id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}

export default TimetablesPage;
