// Copyright Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
import glob from "glob";
import { pathToFile } from "../util/module_paths.js";

export const rootDir = pathToFile(import.meta.url, "../..");

export const buildDir = `${rootDir}/build`;

export const srcDir = `${rootDir}/src`;
export const frontEndDir = `${srcDir}/front_end`;
export const backEndDir = `${srcDir}/back_end`;

export const generatedDir = `${rootDir}/generated`;
export const incrementalDir = `${generatedDir}/incremental`;
export const typescriptDir = `${generatedDir}/typescript`;

export const buildScript = `${rootDir}/build.sh`;

export const watchFiles = memoizedDeglob([
	`${buildDir}/**/*`,
	`${srcDir}/**/*`,
]);

export const watchRestartFiles = memoizedDeglob([
	`${buildDir}/**/*`,
	`${rootDir}/package.json`,
	`${rootDir}/tsconfig.json`,
	`${rootDir}/*.sh`,
], [
	`${buildDir}/node_modules/**/*`,
]);

export const lintFiles = memoizedDeglob([
	`${buildDir}/**/*.js`,
	`${frontEndDir}/**/*.ts`,
	`${frontEndDir}/**/*.tsx`,
], [
	`${buildDir}/node_modules/**/*`,
]);

export const sourcePackages = memoizedDeglob([
	`${frontEndDir}/**/package.json`,
]);

export const compilerDependencies = memoizedDeglob([
	...sourcePackages(),
	`${frontEndDir}/**/*.ts`,
]);

export const testFiles = memoizedDeglob([
	`${buildDir}/**/_*_test.js`,
	`${generatedDir}/typescript/**/_*_test.js`,
]);

export const testDependencies = memoizedDeglob([
	`${buildDir}/**/*.js`,
	...compilerDependencies(),
], [
	`${buildDir}/util/dependency_analysis.js`,
]);


function memoizedDeglob(patternsToFind, patternsToIgnore) {
	return memoize(() => {
		return deglob(patternsToFind, patternsToIgnore);
	});
}

// Cache function results for performance
function memoize(fn) {
	let cache;
	return function() {
		if (cache === undefined) {
			cache = fn();
		}
		return cache;
	};
}

function deglob(patternsToFind, patternsToIgnore) {
	let globPattern = patternsToFind;
	if (Array.isArray(patternsToFind)) {
		if (patternsToFind.length === 1) {
			globPattern = patternsToFind[0];
		}
		else {
			globPattern = "{" + patternsToFind.join(",") + "}";
		}
	}

	return glob.sync(globPattern, { ignore: patternsToIgnore });
}