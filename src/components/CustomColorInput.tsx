import { useState, useRef, useCallback } from "react";
import ColorInput from "./ColorInput";

const CustomColorInput = ({ label, value, onChange, ...props }) => {
  const [opened, setOpened] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef(null);

  const handleSwatchClick = useCallback((event: any) => {
    event.preventDefault();
    event.stopPropagation();
    setOpened(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleContainerClick = useCallback((event: any) => {
    // Prevent closing the popover when clicking on the input or swatch
    event.stopPropagation();
  }, []);

  const inputContainer = useCallback(
    (children: React.ReactNode) => (
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{ position: "relative" }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            left: "0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            width: "1.5rem",
            height: "1.5rem",
            borderRadius: "0.25rem",
            cursor: "pointer",
            zIndex: 1,
          }}
          onClick={handleSwatchClick}
        />
      </div>
    ),
    [handleSwatchClick, handleContainerClick]
  );

  return (
    <div>
      <ColorInput
        ref={inputRef}
        label={label}
        value={value}
        onChange={onChange}
        inputContainer={inputContainer}
        onFocus={() => setOpened(true)}
        popoverProps={{
          opened,
          onClose: () => setOpened(false),
          withinPortal: false,
          ...props.popoverProps,
        }}
        {...props}
      />
    </div>
  );
};

export default CustomColorInput;
