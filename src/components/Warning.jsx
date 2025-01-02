import PropTypes from "prop-types";
import React from "react";
import "./Warning.css";

const Warning = (props) => {
	return <div className="Warning" /*role="alert"*/>{props.children}</div>;
};

Warning.propTypes = {
	children: PropTypes.node.isRequired,
};

export default Warning;
