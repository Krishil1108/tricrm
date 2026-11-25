import React from 'react';
import PropTypes from 'prop-types';
import './ui.css';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  onClick,
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`ui-btn ui-btn--${variant} ui-btn--${size} ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export const IconButton = ({
  icon,
  label,
  variant = 'ghost',
  className = '',
  onClick,
  ...rest
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`ui-icon-btn ui-icon-btn--${variant} ${className}`.trim()}
    {...rest}
  >
    {icon}
  </button>
);

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['ghost', 'danger', 'primary']),
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Button;
