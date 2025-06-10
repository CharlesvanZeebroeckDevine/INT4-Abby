import "./Input.css"

export const Input = ({
    type = "text",
    value,
    onChange,
    placeholder,
    className = "",
    disabled = false,
    required = false,
    name,
    id
}) => {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            name={name}
            id={id}
            className={`input ${className}`}
        />
    )
} 