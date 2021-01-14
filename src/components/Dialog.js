import React from "react";
import PropTypes from "prop-types";
import "./Dialog.css";

const ReportBugLink = (props) => (
	<a
		href="https://github.com/1j01/mopaint/issues/"
		target="_blank"
		rel="noopener noreferrer"
	>
		{props.children}
	</a>
);
ReportBugLink.propTypes = {
	children: PropTypes.node.isRequired,
};

export default function Dialog({
	message,
	error,
	// isError, // might be used to show an icon later
	requestBugReport,
	close,
	extraButtons,
	buttons,
	// TODO: probably make message *content* max 40em, bring in line with `.Dialog details`
	// (and look at some error messages to see if any are made uglier by the automatic line breaks)
	maxWidth="50em",
}) {
	// TODO: use <dialog> etc.
	// TODO: error icon (and other icons as appropriate)

	// NOTE: error.stack is nonstandard and quite different between browsers.
	// In chrome it includes the error message redundantly
	// TODO: handle indentation generically instead of based on cases of Chrome and Firefox
	// (which could change in the future)
	const stackTraceText =
		error &&
		error.stack &&
		(error.stack.indexOf(error.toString()) === 0
			? error.stack.slice(error.toString().length).trimEnd() // Chrome
			: `\n${error.stack.trim()}`.replace(/\n/g, "\n    ")); // Firefox
	const errorText =
		error &&
		(stackTraceText
			? `${error.toString()}\n\nStack trace:${stackTraceText}`
			: error.toString());

	return (
		<div className="Dialog">
			<div className="Dialog-box" style={{maxWidth}}>
				{message || error.message}
				{error && (
					<details>
						<summary>Details</summary>
						<div className="actual-details">
							<pre>{errorText}</pre>
						</div>
					</details>
				)}
				{requestBugReport && (
					<div>
						You should <ReportBugLink>report this bug</ReportBugLink>.
					</div>
				)}
				<div className="Dialog-buttons">
					{buttons || <button onClick={close}>Close</button>}
					{extraButtons}
				</div>
			</div>
		</div>
	);
}

Dialog.propTypes = {
	message: PropTypes.node.isRequired,
	error: PropTypes.object,
	isError: PropTypes.bool,
	requestBugReport: PropTypes.bool,
	close: PropTypes.func,
	extraButtons: PropTypes.node,
	buttons: PropTypes.node,
	maxWidth: PropTypes.number,
};
