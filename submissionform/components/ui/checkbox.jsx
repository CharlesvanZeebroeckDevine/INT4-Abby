import "./checkbox.css"

export const Checkbox = ({
    checked,
    onChange,
    onCheckedChange,
    label,
    className = "",
    disabled = false,
    id,
    name,
    ...props
}) => {
    const handleChange = (e) => {
        if (onChange) {
            onChange(e)
        }
        if (onCheckedChange) {
            onCheckedChange(e.target.checked)
        }
    }

    return (
        <label className={`ui-checkbox-wrapper ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                disabled={disabled}
                className="ui-checkbox"
                id={id}
                name={name}
                aria-label={label}
            />
            <span className="ui-checkbox-label">{label}</span>
        </label>
    )
}
