/**
 * NumberInput Component
 *
 * Custom number input with increment/decrement buttons
 */

import { useState, useEffect } from 'react';
import './NumberInput.css';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  disabled = false,
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync with prop changes
  useEffect(() => {
    const formatted = step < 1 ? value.toFixed(2) : value.toString();
    setInputValue(formatted);
  }, [value, step]);

  const clamp = (val: number) => Math.min(Math.max(val, min), max);

  const handleIncrement = () => {
    const newValue = clamp(value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = clamp(value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Allow empty, negative sign, or decimal point while typing
    if (val === '' || val === '-' || val === '.' || val === '-.') {
      return;
    }

    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      onChange(clamp(numVal));
    }
  };

  const handleBlur = () => {
    // Format value based on step (show decimals if step < 1)
    const formatted = step < 1 ? value.toFixed(2) : value.toString();
    setInputValue(formatted);
  };

  return (
    <div className={`number-input ${disabled ? 'number-input-disabled' : ''}`}>
      <button
        className="number-input-btn"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        type="button"
      >
        <i className="fa-solid fa-minus"></i>
      </button>
      <input
        type="text"
        className="number-input-field"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
      />
      <button
        className="number-input-btn"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        type="button"
      >
        <i className="fa-solid fa-plus"></i>
      </button>
    </div>
  );
}
