/* eslint-disable n8n-nodes-rules/node-param-display-name-wrong-for-dynamic-options */
const gulp = require('gulp');
const fs = require('fs');

// Function to convert SVG to Base64 Data URI
function svgToDataUri(svgContent) {
	return 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');
}

// Task to process icon files
gulp.task('build:icons', (done) => {
	const iconFolder = 'nodes/icons'; // Assuming icons are in nodes/icons
	const outputFolder = 'dist/nodes/icons';

	if (!fs.existsSync(iconFolder)) {
		console.log('Icon folder not found, skipping icon build.');
		return done();
	}

	if (!fs.existsSync(outputFolder)){
		fs.mkdirSync(outputFolder, { recursive: true });
	}

	fs.readdirSync(iconFolder).forEach(file => {
		if (file.endsWith('.svg')) {
			const filePath = `${iconFolder}/${file}`;
			const fileContent = fs.readFileSync(filePath, 'utf8');
			const dataUri = svgToDataUri(fileContent);
			const outputFilePath = `${outputFolder}/${file.replace('.svg', '.icon.js')}`;
			fs.writeFileSync(outputFilePath, `module.exports = \`${dataUri}\`;`);
			console.log(`Processed icon: ${file}`);
		}
	});

	done();
});

// Default task
gulp.task('default', gulp.series('build:icons'));
