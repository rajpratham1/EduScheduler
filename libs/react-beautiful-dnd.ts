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
    droppableProps: React.HTMLAttributes<HTMLDivElement> & { 'data-rbd-droppable-id': string };
}
interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: DraggableId | null;
}
interface DroppableProps {
    // FIX: Changed children return type from React.ReactElement<HTMLElement> to React.ReactElement.
    // Using <HTMLElement> incorrectly infers the props type as the HTMLElement DOM interface,
    // causing type conflicts. React.ReactElement defaults to the correct <any> props.
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement;
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
    // FIX: Changed children return type from React.ReactElement<HTMLElement> to React.ReactElement.
    // This resolves a React.cloneElement overload error by preventing incorrect type inference
    // for the element's props.
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactElement;
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
    
    // Explicitly type the props object for cloneElement to resolve overload ambiguity.
    // FIX: Used Omit to remove the 'translate' property from the type, as its type
    // definition ('string') conflicts with the one expected by React.cloneElement ('boolean').
    // FIX: Also omitting 'part' property from React.HTMLAttributes to resolve a type conflict with React.cloneElement, which expects the 'part' attribute to be a DOMTokenList, not a string.
    // FIX: Omit 'children' to resolve conflict between ReactNode and HTMLCollection types.
    const dragProps: Omit<React.HTMLAttributes<HTMLElement>, 'translate' | 'part' | 'children'> & { draggable: boolean } = {
        draggable: true,
        onDragStart: (e: React.DragEvent<HTMLElement>) => {
            e.dataTransfer.setData("draggableId", draggableId);
            // @ts-ignore
            e.dataTransfer.setData("sourceDroppableId", e.currentTarget.closest('[data-rbd-droppable-id]')?.getAttribute('data-rbd-droppable-id'));
        },
        onDragEnd: (e: React.DragEvent<HTMLElement>) => {
             // This is a simplified drag/drop simulation.
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

    return React.cloneElement(child, dragProps);
};