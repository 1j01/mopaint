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

export default function Dialog({
	message,
	error,
	requestABugReport,
	close,
	extraButtons,
	buttons,
}) {
	// TODO: use <dialog> etc.
	// TODO: error icon (and other icons as appropriate)

	// NOTE: error.stack is nonstandard and quite different between browsers.
	// In chrome it includes the error message redundantly
	const errorText = error.stack
		? error.stack.match(/^\w*Error:/) // should this check be error.stack.indexOf(error.message) === 0?
			? error.stack.trim()
			: `${error.toString()}\n\nStack trace:${`\n${error.stack.trim()}`.replace(
					/\n/g,
					"\n    "
			  )}`
		: error.toString();
	return (
		<div className="Dialog">
			<div className="Dialog-box">
				{message}
				{error && (
					<details>
						<summary>Details</summary>
						<div className="actual-details">
							<pre>{errorText}</pre>
						</div>
					</details>
				)}
				{requestABugReport && (
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
	message: PropTypes.string.isRequired,
	error: PropTypes.object,
	requestABugReport: PropTypes.bool,
	close: PropTypes.func,
	extraButtons: PropTypes.node,
	buttons: PropTypes.node,
};
