import React from "react";
import type { SaveSlot } from "./saveSlots";

interface Props {
  open: boolean;
  slots: SaveSlot[];
  onClose: () => void;
  onSelect: (slot: SaveSlot) => void;
}

const SaveLoadModal: React.FC<Props> = ({ open, slots, onClose, onSelect }) => {
  if (!open) return null;

  return (
    <div className="modal-mask" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>載入棋局存檔</h3>
        {!slots.length && <p>目前沒有存檔。</p>}
        <div className="slot-list">
          {slots.map((slot) => (
            <button key={slot.id} type="button" className="slot-item" onClick={() => onSelect(slot)}>
              <img src={slot.preview} alt={slot.label} width={120} height={120} />
              <div>
                <p>{slot.label}</p>
                <p>{slot.savedAt}</p>
              </div>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose}>
          關閉
        </button>
      </div>
    </div>
  );
};

export default SaveLoadModal;
