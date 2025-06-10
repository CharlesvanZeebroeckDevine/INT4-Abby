import "./checkbox.css"

export const Checkbox = ({
    checked,
    onChange,
    label,
    className = "",
    disabled = false,
    ...props
}) => {
    return (
        <label className={`ui-checkbox-wrapper ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="ui-checkbox"
                {...props}
            />
            <span className="ui-checkbox-label">{label}</span>
        </label>
    )
}
