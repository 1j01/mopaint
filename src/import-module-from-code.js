let nextID = 1;
function importModuleFromCode(code) {
	return new Promise((resolve, reject) => {
		const globalVarName = `$importModuleGlobalExport$_${nextID++}`;

		const codeBlob = new Blob([code], { type: "text/javascript" });
		const codeBlobUrl = URL.createObjectURL(codeBlob);
		const loader = `import * as m from "${codeBlobUrl}"; window.${globalVarName} = m;`;
		const loaderBlob = new Blob([loader], { type: "text/javascript" });
		const loaderBlobUrl = URL.createObjectURL(loaderBlob);

		const script = document.createElement("script");
		const destructor = () => {
			delete window[globalVarName];
			script.remove();
			URL.revokeObjectURL(codeBlobUrl);
			URL.revokeObjectURL(loaderBlobUrl);
		};
		script.defer = true;
		script.type = "module";
		script.onerror = () => {
			reject(new Error(`Failed to import module from code.`));
			destructor();
		};
		script.onload = () => {
			resolve(window[globalVarName]);
			destructor();
		};
		script.src = loaderBlobUrl;

		document.head.appendChild(script);
	});
}

export default importModuleFromCode;
