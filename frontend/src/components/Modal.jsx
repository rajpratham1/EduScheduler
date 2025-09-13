import React from 'react';
import './Modal.css';

function Modal({ children, show, onClose }) {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">X</button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
