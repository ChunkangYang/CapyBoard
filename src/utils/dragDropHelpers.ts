import { DragItem, Position, BoardItem } from '../engine/types';

export const createDragItem = (type: 'token' | 'card' | 'dice', id: string, name: string): DragItem => {
  return {
    type,
    id,
    name,
  };
};

export const createBoardItem = (dragItem: DragItem, position: Position): BoardItem => {
  return {
    id: dragItem.id,
    type: dragItem.type,
    position,
    properties: {},
  };
};

export const calculateDropPosition = (clientX: number, clientY: number, containerRect: DOMRect): Position => {
  return {
    x: clientX - containerRect.left,
    y: clientY - containerRect.top,
  };
};

export const isPositionValid = (position: Position, containerRect: DOMRect): boolean => {
  return position.x >= 0 && position.x <= containerRect.width &&
         position.y >= 0 && position.y <= containerRect.height;
};

export const snapToGrid = (position: Position, gridSize: number = 20): Position => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};


