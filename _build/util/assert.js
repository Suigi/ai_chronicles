// Copyright Titanium I.T. LLC. For license, see "README" or "LICENSE" file.

// A small modification to Chai. Why? Just to demonstrate how you can customize an assertion library
// without writing it all yourself. And because Chai isn't perfect.

import { assert as chai } from "chai";

const exports = chai;
export default exports;

// By default, Chai's assert.equal does type conversions. DO. NOT. WANT.
exports.equal = chai.strictEqual;

exports.includes = function(actual, expected, message) {
	checkExpected(expected);
	if (!actual.includes(expected)) {
		fail(message, `'${actual}' should include '${expected}'`);
	}
};

exports.notIncludes = function(actual, expected, message) {
	checkExpected(expected);
	if (actual.includes(expected)) {
		fail(message, `'${actual}' should not include '${expected}'`);
	}
};

exports.throwsAsync = async function(fnAsync, expectedRegexOrExactString, message) {
	try {
		await fnAsync();
	}
	catch (err) {
		if (expectedRegexOrExactString === undefined) return;
		if (typeof expectedRegexOrExactString === "string") {
			exports.equal(err.message, expectedRegexOrExactString, message);
		}
		else {
			exports.match(err.message, expectedRegexOrExactString, message);
		}
		return;
	}
	fail(message, "Expected exception");
};

exports.doesNotThrowAsync = async function(fnAsync) {
	await fnAsync();
};

exports.promiseResolvesAsync = async function(promise, message) {
	const promiseResolves = await doesPromiseResolve(promise);
	if (!promiseResolves) fail(message, "Expected promise to resolve, but it didn't");
};

exports.promiseDoesNotResolveAsync = async function(promise, message) {
	const promiseResolves = await doesPromiseResolve(promise);
	if (promiseResolves) fail(message, "Expected promise to not resolve, but it did");
};



async function doesPromiseResolve(promise) {
	let promiseResolved = false;
	promise.then(() => {
		promiseResolved = true;
	});

	await drainEventLoopAsync();
	return promiseResolved;
}

async function drainEventLoopAsync() {
	await new Promise((resolve, reject) => {
		// We call setImmediate() twice because some callbacks are executed after setImmediate.
		setImmediate(() => {
			setImmediate(resolve);
		});
	});
}

function fail(userMessage, assertionMessage) {
	userMessage = userMessage ? `${userMessage}: ` : "";
	chai.fail(`${userMessage}${assertionMessage}`);
}

function checkExpected(expected) {
	if (expected === undefined) chai.fail("'undefined' provided as expected value in assertion");
}