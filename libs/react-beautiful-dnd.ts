// libs/react-beautiful-dnd.ts
// This is a mock implementation of react-beautiful-dnd to avoid version conflicts with React 19.
// It provides the necessary component structure and props for the application to run.

import React from 'react';

// --- Types (copied from @types/react-beautiful-dnd for compatibility) ---
export type DraggableId = string;
export type DroppableId = string;
export type TypeId = string;
export interface DraggableLocation {
    droppableId: DroppableId;
    index: number;
}
export interface DropResult {
    reason: 'DROP' | 'CANCEL';
    destination?: DraggableLocation | null;
    source: DraggableLocation;
    draggableId: DraggableId;
    type: TypeId;
    mode: 'FLUID' | 'SNAP';
}
export type OnDragEndResponder = (result: DropResult) => void;

// --- Components ---

// DragDropContext: The main wrapper
interface DragDropContextProps {
    children: React.ReactNode;
    onDragEnd: OnDragEndResponder;
}
export const DragDropContext: React.FC<DragDropContextProps> = ({ children, onDragEnd }) => {
    // This mock will pass through the children and attach the drag end handler to the window for simplicity.
    // In a real shim, you'd use React Context.
    // @ts-ignore
    window.onDragEnd = onDragEnd;
    return React.createElement(React.Fragment, null, children);
};

// Droppable
interface DroppableProvided {
    innerRef: React.Ref<any>;
    placeholder: React.ReactNode;
    // FIX: Explicitly allow data-* attributes on droppableProps.
    droppableProps: React.HTMLAttributes<HTMLDivElement> & { 'data-rbd-droppable-id': string };
}
interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: DraggableId | null;
}
interface DroppableProps {
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement<HTMLElement>;
    droppableId: DroppableId;
    isDropDisabled?: boolean;
}
export const Droppable: React.FC<DroppableProps> = ({ children, droppableId }) => {
    const provided: DroppableProvided = {
        innerRef: React.createRef(),
        placeholder: null,
        droppableProps: { 'data-rbd-droppable-id': droppableId },
    };
    const snapshot: DroppableStateSnapshot = {
        isDraggingOver: false,
    };
    return children(provided, snapshot);
};

// Draggable
interface DraggableProvidedDraggableProps {
    style?: React.CSSProperties;
}
interface DraggableProvidedDragHandleProps {
    // Props for the drag handle
}
interface DraggableProvided {
    innerRef: React.Ref<any>;
    draggableProps: DraggableProvidedDraggableProps;
    dragHandleProps: DraggableProvidedDragHandleProps | null;
}
interface DraggableStateSnapshot {
    isDragging: boolean;
    draggingOver?: DroppableId | null;
}
interface DraggableProps {
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactElement<HTMLElement>;
    draggableId: DraggableId;
    index: number;
    isDragDisabled?: boolean;
}
export const Draggable: React.FC<DraggableProps> = ({ children, draggableId }) => {
    const provided: DraggableProvided = {
        innerRef: React.createRef(),
        draggableProps: { style: {} },
        dragHandleProps: null,
    };
    const snapshot: DraggableStateSnapshot = {
        isDragging: false,
    };
    
    // The actual drag logic would be complex. For a shim, we can just render the children.
    const child = children(provided, snapshot);

    // FIX: Explicitly type the props object for cloneElement to resolve overload ambiguity.
    // This ensures that React's camelCased event handlers like onDragStart are recognized.
    const dragProps = {
        draggable: true,
        onDragStart: (e: React.DragEvent<HTMLElement>) => {
            e.dataTransfer.setData("draggableId", draggableId);
            // @ts-ignore
            e.dataTransfer.setData("sourceDroppableId", e.currentTarget.closest('[data-rbd-droppable-id]')?.getAttribute('data-rbd-droppable-id'));
        },
        onDragEnd: (e: React.DragEvent<HTMLElement>) => {
             // This is a simplified drag/drop simulation.
             // It doesn't find the correct drop target but shows the principle.
        },
        onDrop: (e: React.DragEvent<HTMLElement>) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData("draggableId");
            const sourceId = e.dataTransfer.getData("sourceDroppableId");
            // @ts-ignore
            const destId = e.currentTarget.closest('[data-rbd-droppable-id]')?.getAttribute('data-rbd-droppable-id');

            const result: DropResult = {
                draggableId: draggedId,
                source: { droppableId: sourceId, index: 0 },
                destination: { droppableId: destId, index: 0 },
                reason: 'DROP',
                mode: 'FLUID',
                type: 'DEFAULT'
            };
            // @ts-ignore
            if (window.onDragEnd) {
                // @ts-ignore
                window.onDragEnd(result);
            }
        },
        onDragOver: (e: React.DragEvent<HTMLElement>) => {
            e.preventDefault(); // Necessary to allow dropping
        }
    };

    // To make it "draggable" in a mock sense, we can add some basic HTML drag attributes.
    return React.cloneElement(child, dragProps);
};
