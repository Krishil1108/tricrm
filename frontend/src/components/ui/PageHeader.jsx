import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './ui.css';

/**
 * Unified PageHeader component (Fix 3) — fixed positions for breadcrumb, title, subtitle, and primary actions.
 */
const PageHeader = ({ title, subtitle, breadcrumbs = [], actions = null, icon = null }) => {
  return (
    <header className="ui-page-header">
      <div className="ui-page-header-left">
        {breadcrumbs.length > 0 && (
          <nav className="ui-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="ui-breadcrumb-sep">/</span>}
                {crumb.path ? (
                  <Link to={crumb.path} className="ui-breadcrumb-link">{crumb.label}</Link>
                ) : (
                  <span className="ui-breadcrumb-current">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="ui-page-title-row">
          {icon && <span className="ui-page-icon" aria-hidden="true">{icon}</span>}
          <div>
            <h1 className="ui-page-title">{title}</h1>
            {subtitle && <p className="ui-page-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </header>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string
    })
  ),
  actions: PropTypes.node,
  icon: PropTypes.node
};

export default PageHeader;
