import { useState, useRef } from "react";

function ColorInput({ label, value, onChange, inputContainer, ...props }) {
  const [opened, setOpened] = useState(false);
  const inputRef = useRef(null);

  const handleFocus = () => {
    setOpened(true);
  };

  const handleChange = (e) => {
    onChange(e.target.value); // Update the color value on change
  };

  const handleClosePopover = () => {
    setOpened(false);
  };

  return (
    <div className="form-group">
      {label && <label htmlFor="color-input">{label}</label>}
      <div ref={inputContainer}>
        <input
          className="select"
          id="color-input"
          ref={inputRef}
          type="color"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          {...props}
        />
        {opened && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              background: "#fff",
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "4px",
              zIndex: 10,
            }}
            onClick={handleClosePopover}
          >
            <p>Color Picker Popover</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ColorInput;
