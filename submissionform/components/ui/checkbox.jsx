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
    const handleInputChange = (e) => {
        if (onCheckedChange) {
            onCheckedChange(e.target.checked)
        } else if (onChange) {
            onChange(e)
        }
    }

    return (
        <label className={`ui-checkbox-wrapper ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={handleInputChange}
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
