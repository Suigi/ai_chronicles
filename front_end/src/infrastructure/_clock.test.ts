// Copyright Titanium I.T. LLC.
import { test, assert } from "../util/tests.js";
import { Clock } from "./clock.js";

export default test(({ describe }) => {

	describe("information", ({ it }) => {

		it("provides current timestamp", () => {
			const clock = Clock.create();

			let expected = Date.now();
			const actual = clock.now();
			if (actual !== expected) expected = Date.now();
			assert.equal(actual, expected);
		});

		it("tells us how many milliseconds have elapsed since a time", async () => {
			const nullClock = Clock.createNull({ now: 50 });
			await nullClock.advanceNulledClockAsync(999);

			assert.equal(nullClock.millisecondsSince(50), 999, "should compare to number");
			assert.equal(nullClock.millisecondsSince(new Date(50)), 999, "should compare to Date");
		});

		it("tells us how many milliseconds until a time", () => {
			const nullClock = Clock.createNull({ now: 100 });
			assert.equal(nullClock.millisecondsUntil(500), 400, "should compare to number");
			assert.equal(nullClock.millisecondsUntil(new Date(500)), 400, "should compare to Date");
		});

	});


	describe("wait", ({ it }) => {

		it("waits N milliseconds", async () => {
			const clock = Clock.create();

			const start = clock.now();
			await clock.waitAsync(10);
			const elapsedTime = clock.now() - start;
			assert.atLeast(elapsedTime, 9);
		});

	});


	describe("repeat", ({ it }) => {

		it("calls a function every N milliseconds", async () => {
			const clock = Clock.createNull();		// real clock is too nondeterministic to test directly

			let runCount = 0;
			const stopFn = clock.repeat(5, () => runCount++);

			await clock.advanceNulledClockAsync(15);
			assert.equal(runCount, 3, "should call repeat function on regular interval");

			stopFn();
			await clock.advanceNulledClockAsync(1000);
			assert.equal(runCount, 3, "should not call repeat function after stop function called");
		});

	});


	describe("timeouts", ({ it }) => {

		function createTimeoutFn(result: string | Error = "default timeout function result") {
			const timeoutFn = () => {
				timeoutFn.ran = true;
				if (result instanceof Error) return Promise.reject(result);
				else return Promise.resolve(result);
			};

			timeoutFn.ran = false;
			return timeoutFn;
		}

		it("resolves if promise resolves before timeout", async () => {
			const clock = Clock.createNull();
			const timeoutFnAsync = createTimeoutFn();
			const promise = Promise.resolve("result");

			const result = await clock.timeoutAsync(10000, () => promise, timeoutFnAsync);
			assert.equal(await result, "result", "should return result of promise");
			assert.equal(timeoutFnAsync.ran, false, "should not run timeout function");

			await clock.advanceNulledClockUntilTimersExpireAsync();
			assert.equal(clock.now(), 0, "should resolve immediately");
		});

		it("rejects if promise rejects before timeout", async () => {
			const clock = Clock.createNull();
			const timeoutFnAsync = createTimeoutFn();
			const promise = Promise.reject(new Error("my error"));

			await assert.throwsAsync(
				() => clock.timeoutAsync(10000, () => promise, timeoutFnAsync),
				"my error",
				"should return result of promise"
			);
			assert.equal(timeoutFnAsync.ran, false, "should not run timeout function");

			await clock.advanceNulledClockUntilTimersExpireAsync();
			assert.equal(clock.now(), 0, "should resolve immediately");
		});

		it("resolves via timeout function if promise times out", async () => {
			const clock = Clock.createNull();
			const timeoutFnAsync = createTimeoutFn("timeout result");

			const promise = new Promise(() => {});
			const timeoutPromise = clock.timeoutAsync(10000, () => promise, timeoutFnAsync);

			await clock.advanceNulledClockUntilTimersExpireAsync();
			assert.equal(clock.now(), 10000, "should wait for timeout");
			assert.equal(timeoutFnAsync.ran, true, "should run timeout function");
			assert.equal(await timeoutPromise, "timeout result", "should return result of timeout function");
		});

		it("rejects via timeout function if promise times out and timeout rejects", async () => {
			const clock = Clock.createNull();
			const timeoutFnAsync = createTimeoutFn(new Error("my error"));

			const promise = new Promise(() => {});
			const timeoutPromise = clock.timeoutAsync(10000, () => promise, timeoutFnAsync);
			timeoutPromise.catch(() => {});   // prevent 'unhandled promise exception'

			await clock.advanceNulledClockUntilTimersExpireAsync();
			assert.equal(clock.now(), 10000, "should wait for timeout");
			assert.equal(timeoutFnAsync.ran, true, "should run timeout function");
			await assert.throwsAsync(
				() => timeoutPromise,
				"my error",
				"should reject because timeout function rejected"
			);
		});

		it("ignores promise rejection after timeout", async () => {
			const clock = Clock.createNull();
			const timeoutFnAsync = createTimeoutFn("timeout result");
			const promise = (async () => {
				await clock.waitAsync(20000);
				throw new Error("this error should be ignored");
			})();

			const timeoutPromise = clock.timeoutAsync(10000, () => promise, timeoutFnAsync);
			await clock.advanceNulledClockUntilTimersExpireAsync();
			assert.equal(await timeoutPromise, "timeout result");
		});

	});


	describe("nullability", ({ it }) => {

		it("defaults 'now' to zero", () => {
			const clock = Clock.createNull();
			assert.equal(clock.now(), 0);
		});

		it("allows 'now' to be configured using milliseconds", () => {
			const clock = Clock.createNull({ now: 300 });
			assert.equal(clock.now(), 300);
		});

		it("can advance the clock", async () => {
			const clock = Clock.createNull();
			await clock.advanceNulledClockAsync(10);
			assert.equal(clock.now(), 10);
		});

		it("can advance the clock until all timers expired", async () => {
			const clock = Clock.createNull();
			clock.waitAsync(999);
			await clock.advanceNulledClockUntilTimersExpireAsync();
			assert.equal(clock.now(), 999);
		});

		it("fails fast when attempting to advance the system clock", async () => {
			const clock = Clock.create();
			await assert.throwsAsync(
				() => clock.advanceNulledClockAsync(10),
				"Can't advance the clock because it isn't a nulled clock"
			);
			await assert.throwsAsync(
				() => clock.advanceNulledClockUntilTimersExpireAsync(),
				"Can't advance the clock because it isn't a nulled clock"
			);
		});

		it("can wait", async () => {
			const clock = Clock.createNull();
			let wait: string | number = "waiting";

			clock.waitAsync(10).then(() => {
				wait = clock.now();
			});
			assert.equal(wait, "waiting");
			await clock.advanceNulledClockAsync(20);
			assert.equal(wait, 10);
		});

		it("can repeat", async () => {
			const clock = Clock.createNull();

			let runCount = 0;
			const stopFn = clock.repeat(100, () => {
				runCount++;
				if (runCount > 50) stopFn();
			});

			assert.equal(runCount, 0, "start");

			await clock.advanceNulledClockAsync(100);
			assert.equal(runCount, 1, "manual tick");

			await clock.advanceNulledClockUntilTimersExpireAsync();
			assert.equal(runCount, 51, "automatic tick");
		});

		it("can timeout", async () => {
			const clock = Clock.createNull();
			await clock.timeoutAsync(10, () => Promise.resolve(), () => {});
		});

	});

});