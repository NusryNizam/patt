import { useRef } from "react";

function ColorInput({ label, value, onChange, inputContainer, ...props }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    onChange(e.target.value); // Update the color value on change
  };

  return (
    <div className="form-group block">
      <label htmlFor="color-input" className="caption">
        {label}
      </label>
      <br />
      <input
        className="select caption"
        id="color-input"
        ref={inputRef}
        type="color"
        value={value}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}

export default ColorInput;
